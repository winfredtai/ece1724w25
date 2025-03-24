import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 定义结果类型
interface UpdateResult {
  taskId: string;
  success: boolean;
  newStatus?: string;
  error?: string;
}

// 获取访问API所需的认证令牌
async function getAuthToken(supabase: any) {
  try {
    // 尝试获取系统预设的API密钥
    const apiKey = process.env.API_SECRET_KEY;
    if (apiKey) {
      console.log("从环境变量获取到API密钥");
      return apiKey;
    }
    
    // 从Vercel环境变量中获取专门的内部API令牌
    const internalApiToken = process.env.INTERNAL_API_TOKEN;
    if (internalApiToken) {
      console.log("从环境变量获取到内部API令牌");
      return internalApiToken;
    }
    
    // 尝试从数据库获取
    try {
      // 检查表是否存在
      const { data: tableExists, error: checkError } = await supabase
        .from('system_settings')
        .select('count(*)', { count: 'exact', head: true });
      
      if (checkError) {
        // 如果表不存在，会抛出错误
        console.log("system_settings表不存在，跳过数据库查询");
        return null;
      }
      
      // 如果表存在，尝试获取token
      const { data, error } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'api_token')
        .single();
        
      if (error) throw error;
      console.log("从数据库获取到API令牌");
      return data?.value || null;
    } catch (dbError) {
      // 忽略数据库错误，继续运行
      console.warn("数据库查询失败，将尝试无认证调用API:", dbError);
      return null;
    }
  } catch (error) {
    console.error('获取认证令牌失败:', error);
    // 返回null，表示无认证
    return null;
  }
}

export async function GET() {
  console.log("开始执行视频状态更新任务...");
  console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "已设置" : "未设置");
  console.log("Service Role Key:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "已设置" : "未设置");
  console.log("Public URL:", process.env.NEXT_PUBLIC_URL || "未设置");
  
  // 确保有正确的公共URL
  const publicUrl = process.env.NEXT_PUBLIC_URL || "https://karavideo-bbgbalrw1-hfhls-projects.vercel.app";
  console.log("使用的Public URL:", publicUrl);
  
  // 使用service_role密钥创建客户端，这会绕过RLS
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    {
      auth: { persistSession: false }
    }
  );
  
  // 获取认证令牌
  const authToken = await getAuthToken(supabase);
  console.log("认证令牌:", authToken ? "已获取" : "未设置");
  
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
        
        let statusData;
        let apiSource = '未知';
        
        try {
          // 尝试方法1: 直接调用302AI API
          const apiUrl = `https://api.302.ai/klingai/task/${task.external_task_id}/fetch`;
          console.log(`尝试调用302AI API: ${apiUrl}`);
          
          // 设置超时
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 90000);
          
          const response = await fetch(apiUrl, {
            signal: controller.signal,
            headers: { 
              'Cache-Control': 'no-cache',
              'Authorization': process.env.API_302_TOKEN || ''
            }
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            throw new Error(`302AI API请求失败: ${response.status}`);
          }
          
          statusData = await response.json();
          apiSource = '302AI';
          console.log(`成功从302AI获取任务 ${task.external_task_id} 的状态`);
        } catch (externalApiError) {
          // 外部API失败，尝试方法2: 使用内部API
          console.warn(`302AI API调用失败: ${externalApiError}`);
          
          try {
            // 构建内部API URL
            const internalApiUrl = `${publicUrl}/api/videos/status/${task.external_task_id}`;
            console.log(`尝试调用内部API: ${internalApiUrl}`);
            
            // 准备必要的headers
            const headers: Record<string, string> = { 
              'Cache-Control': 'no-cache'
            };
            
            // 添加认证header (如果有token)
            if (authToken) {
              headers['Authorization'] = `Bearer ${authToken}`;
              console.log("添加认证头到请求");
            } else {
              console.log("无认证令牌，尝试无认证请求");
            }
            
            const internalResponse = await fetch(internalApiUrl, { headers });
            
            if (!internalResponse.ok) {
              throw new Error(`内部API请求失败: ${internalResponse.status}`);
            }
            
            statusData = await internalResponse.json();
            apiSource = '内部API';
            console.log(`成功从内部API获取任务 ${task.external_task_id} 的状态`);
          } catch (internalApiError) {
            // 两种API都失败，进入备用模式
            console.error(`所有API调用失败: ${internalApiError}`);
            console.log(`进入备用模式，使用状态检查逻辑`);
            
            // 如果任务已处理超过24小时仍是processing，可能卡住了，标记为失败
            const now = new Date();
            const updatedAt = new Date(task.updated_at);
            const hoursDiff = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60);
            
            if (task.status === "processing" && hoursDiff > 24) {
              // 任务处理时间过长，可能卡住，标记为失败
              console.log(`任务 ${task.external_task_id} 处理超过24小时，可能卡住，标记为失败`);
              
              statusData = {
                success: false,
                status: -1,
                message: "任务处理超时，可能卡住"
              };
              apiSource = '超时检测';
            } else {
              // 对于其他情况，保持当前状态
              console.log(`无法获取任务 ${task.external_task_id} 的最新状态，保持当前状态`);
              throw internalApiError; // 重新抛出错误
            }
          }
        }
        
        console.log(`获取到任务 ${task.external_task_id} 的API响应 (来源: ${apiSource}):`, 
          JSON.stringify(statusData).substring(0, 200) + "...");
        
        let newStatus = task.status; // 默认保持原状态
        let resultUrl = null;
        let thumbnailUrl = null;
        let errorMessage = null;
        
        // 解析API响应格式 - 处理两种可能的API响应结构
        if (statusData.success && statusData.data?.data) {
          // 处理内部API格式 (/api/videos/status/)
          const apiData = statusData.data.data;
          
          console.log(`任务 ${task.external_task_id} 状态码: ${apiData.status}`);
          
          // 检查任务状态
          if (apiData.status === 99 && apiData.works && apiData.works.length > 0) {
            // 状态为99表示已完成
            newStatus = "completed";
            resultUrl = apiData.works[0].resource?.resource || null;
            thumbnailUrl = apiData.works[0].cover?.resource || null;
            console.log(`任务 ${task.external_task_id} 已完成，视频URL: ${resultUrl?.substring(0, 50)}...`);
          } else if (apiData.status === -1) {
            // 失败
            newStatus = "failed";
            errorMessage = apiData.message || "视频生成失败";
            console.log(`任务 ${task.external_task_id} 失败: ${errorMessage}`);
          } else if (apiData.status === 5 || apiData.queuingEtaTime > 0) {
            // 队列中
            newStatus = "queued";
            console.log(`任务 ${task.external_task_id} 在队列中等待`);
          } else if (apiData.status === 10 || apiData.etaTime > 0) {
            // 处理中
            newStatus = "processing";
            console.log(`任务 ${task.external_task_id} 正在处理中`);
          } else {
            console.log(`任务 ${task.external_task_id} 状态未知: ${apiData.status}，保持当前状态 ${newStatus}`);
          }
        } else if (statusData.result === 1 && statusData.data) {
          // 处理302AI API格式 (/klingai/task/)
          const apiData = statusData.data;
          
          console.log(`302AI 任务 ${task.external_task_id} 状态: ${apiData.status || 'unknown'}`);
          
          if (apiData.status === 99 && apiData.resource) {
            // 已完成
            newStatus = "completed";
            resultUrl = apiData.resource || null;
            thumbnailUrl = apiData.cover || null;
            console.log(`任务 ${task.external_task_id} 已完成 (302AI)，视频URL: ${resultUrl?.substring(0, 50)}...`);
          } else if (apiData.status === -1) {
            // 失败
            newStatus = "failed";
            errorMessage = apiData.message || "视频生成失败";
            console.log(`任务 ${task.external_task_id} 失败 (302AI): ${errorMessage}`);
          } else if (apiData.status === 5 || (apiData.queuingEtaTime && apiData.queuingEtaTime > 0)) {
            // 队列中
            newStatus = "queued";
            console.log(`任务 ${task.external_task_id} 在队列中等待 (302AI)`);
          } else if (apiData.status === 10 || (apiData.etaTime && apiData.etaTime > 0)) {
            // 处理中
            newStatus = "processing";
            console.log(`任务 ${task.external_task_id} 正在处理中 (302AI)`);
          } else {
            console.log(`302AI 任务 ${task.external_task_id} 状态无法识别，保持当前状态 ${newStatus}`);
          }
        } else if (statusData.status === -1 || (statusData.success === false && statusData.status)) {
          // 处理备用模式或直接的失败状态
          newStatus = "failed";
          errorMessage = statusData.message || "视频生成失败";
          console.log(`任务 ${task.external_task_id} 失败 (备用逻辑): ${errorMessage}`);
        } else {
          // 无法解析的响应
          console.log(`无法解析任务 ${task.external_task_id} 的状态，完整响应:`, JSON.stringify(statusData));
          console.log(`保持任务 ${task.external_task_id} 的当前状态: ${newStatus}`);
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