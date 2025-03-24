import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 定义结果类型
interface UpdateResult {
  taskId: string;
  success: boolean;
  newStatus?: string;
  error?: string;
}

export async function GET() {
  console.log("开始执行视频状态更新任务...");
  console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "已设置" : "未设置");
  console.log("Service Role Key:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "已设置" : "未设置");
  console.log("Public URL:", process.env.NEXT_PUBLIC_URL || "未设置");
  
  // 使用service_role密钥创建客户端，这会绕过RLS
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    {
      auth: { persistSession: false }
    }
  );
  
  try {
    console.log("尝试查询待处理任务...");
    
    // 1. 获取所有处理中的任务
    const { data: pendingTasks, error } = await supabase
      .from("video_generation_task_statuses")
      .select(`
        id,
        task_id,
        external_task_id,
        status,
        updated_at
      `)
      .in("status", ["processing", "pending"])
      .order("updated_at", { ascending: true });  // 优先检查等待时间最长的任务
    
    if (error) {
      console.error("查询待处理任务失败:", error);
      throw error;
    }
    
    console.log(`发现 ${pendingTasks?.length || 0} 个待处理任务`);
    
    if (pendingTasks && pendingTasks.length > 0) {
      // 打印前3个任务的详细信息以便诊断
      pendingTasks.slice(0, 3).forEach((task, index) => {
        console.log(`任务 ${index + 1}: ID=${task.id}, 外部ID=${task.external_task_id}, 状态=${task.status}`);
      });
    }
    
    // 如果没有待处理任务，直接返回
    if (!pendingTasks || pendingTasks.length === 0) {
      console.log("没有待处理的任务，提前返回");
      return NextResponse.json({ 
        success: true, 
        message: "没有待处理的任务", 
        processed: 0 
      });
    }
    
    // 2. 为每个任务检查最新状态
    const updatePromises = pendingTasks.map(async (task) => {
      try {
        console.log(`开始检查任务 ${task.external_task_id} 的状态...`);
        
        // 构建API URL，避免自引用
        const apiUrl = `${process.env.NEXT_PUBLIC_URL || ""}/api/videos/status/${task.external_task_id}`;
        console.log(`调用API: ${apiUrl}`);
        
        // 调用API获取最新状态，添加超时处理
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时
        
        const response = await fetch(apiUrl, { 
          signal: controller.signal,
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          console.error(`API请求失败: ${response.status} ${response.statusText}`);
          throw new Error(`API请求失败: ${response.status}`);
        }
        
        const statusData = await response.json();
        console.log(`获取到任务 ${task.external_task_id} 的API响应:`, 
          JSON.stringify(statusData).substring(0, 200) + "...");
        
        let newStatus = "processing";
        let resultUrl = null;
        let thumbnailUrl = null;
        let errorMessage = null;
        
        // 解析状态
        if (statusData.success && statusData.data?.data) {
          const apiData = statusData.data.data;
          
          // 检查任务状态
          if (apiData.status === 99 && apiData.works && apiData.works.length > 0) {
            newStatus = "completed";
            resultUrl = apiData.works[0].resource?.resource || null;
            thumbnailUrl = apiData.works[0].cover?.resource || null;
            console.log(`任务 ${task.external_task_id} 已完成，视频URL: ${resultUrl?.substring(0, 50)}...`);
          } else if (apiData.status === -1) {
            newStatus = "failed";
            errorMessage = apiData.message || "视频生成失败";
            console.log(`任务 ${task.external_task_id} 失败: ${errorMessage}`);
          } else if (apiData.status === 5 || apiData.queuingEtaTime > 0) {
            newStatus = "queued";
            console.log(`任务 ${task.external_task_id} 在队列中等待`);
          } else if (apiData.status === 10 || apiData.etaTime > 0) {
            newStatus = "processing";
            console.log(`任务 ${task.external_task_id} 正在处理中`);
          } else {
            console.log(`任务 ${task.external_task_id} 状态未知: ${apiData.status}`);
          }
        } else if (statusData.status === -1) {
          newStatus = "failed";
          errorMessage = statusData.message || "视频生成失败";
          console.log(`任务 ${task.external_task_id} 失败: ${errorMessage}`);
        } else {
          console.log(`无法识别任务 ${task.external_task_id} 的状态:`, 
            JSON.stringify(statusData).substring(0, 200));
        }
        
        // 只有当状态有变化时才更新数据库
        if (newStatus !== task.status || resultUrl) {
          console.log(`任务 ${task.external_task_id} 状态从 ${task.status} 变为 ${newStatus}，更新数据库`);
          
          const { error: updateError } = await supabase
            .from("video_generation_task_statuses")
            .update({
              status: newStatus,
              result_url: resultUrl,
              thumbnail_url: thumbnailUrl,
              error_message: errorMessage,
              updated_at: new Date().toISOString()
            })
            .eq("id", task.id);
          
          if (updateError) {
            console.error(`更新任务 ${task.external_task_id} 状态失败:`, updateError);
            throw updateError;
          }
          
          console.log(`已更新任务 ${task.external_task_id} 状态为 ${newStatus}`);
        } else {
          console.log(`任务 ${task.external_task_id} 状态未变化，保持为 ${task.status}`);
        }
        
        return { taskId: task.external_task_id, success: true, newStatus };
      } catch (taskError) {
        console.error(`检查任务 ${task.external_task_id} 状态失败:`, taskError);
        return { 
          taskId: task.external_task_id, 
          success: false, 
          error: taskError instanceof Error ? taskError.message : String(taskError) 
        };
      }
    });
    
    // 等待所有任务检查完成
    console.log("等待所有任务检查完成...");
    const results = await Promise.allSettled(updatePromises);
    const successCount = results.filter(
      r => r.status === 'fulfilled' && (r.value as UpdateResult).success
    ).length;
    
    console.log(`任务处理完成: 总计 ${pendingTasks.length} 个任务, 成功 ${successCount} 个, 失败 ${pendingTasks.length - successCount} 个`);
    
    return NextResponse.json({ 
      success: true, 
      processed: pendingTasks.length,
      successCount,
      failCount: pendingTasks.length - successCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("更新视频状态失败:", error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
} 