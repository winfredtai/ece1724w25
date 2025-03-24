import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

// 定义结果类型
interface UpdateResult {
  taskId: string;
  success: boolean;
  newStatus?: string;
  error?: string;
}

export async function GET() {
  const supabase = await createClient();
  
  try {
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
    
    if (error) throw error;
    
    console.log(`发现 ${pendingTasks?.length || 0} 个待处理任务`);
    
    // 如果没有待处理任务，直接返回
    if (!pendingTasks || pendingTasks.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: "没有待处理的任务", 
        processed: 0 
      });
    }
    
    // 2. 为每个任务检查最新状态
    const updatePromises = pendingTasks.map(async (task) => {
      try {
        // 调用API获取最新状态
        const response = await fetch(`${process.env.NEXT_PUBLIC_URL || ""}/api/videos/status/${task.external_task_id}`);
        const statusData = await response.json();
        
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
          } else if (apiData.status === -1) {
            newStatus = "failed";
            errorMessage = apiData.message || "视频生成失败";
          } else if (apiData.status === 5 || apiData.queuingEtaTime > 0) {
            newStatus = "queued";
          } else if (apiData.status === 10 || apiData.etaTime > 0) {
            newStatus = "processing";
          }
        } else if (statusData.status === -1) {
          newStatus = "failed";
          errorMessage = statusData.message || "视频生成失败";
        }
        
        // 只有当状态有变化时才更新数据库
        if (newStatus !== task.status || resultUrl) {
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
          
          if (updateError) throw updateError;
          
          console.log(`已更新任务 ${task.external_task_id} 状态为 ${newStatus}`);
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
    const results = await Promise.allSettled(updatePromises);
    const successCount = results.filter(
      r => r.status === 'fulfilled' && (r.value as UpdateResult).success
    ).length;
    
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