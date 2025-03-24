import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

// 定义接口
interface TaskDefinition {
  id: string;
  prompt: string;
  negative_prompt: string;
  model: string;
  high_quality: boolean;
  user_id: string;
}

interface TaskStatus {
  id: string;
  task_id: string;
  external_task_id: string;
  status: string;
  result_url: string | null;
  thumbnail_url: string | null;
  error_message: string | null;
  updated_at: string;
  video_generation_task_definitions: TaskDefinition;
}

// 使用类型断言避开类型检查问题
type RouteParams = { params: { id: string } };

export async function GET(
  request: Request,
  context: RouteParams
) {
  const supabase = await createClient();
  const externalTaskId = context.params.id;
  
  try {
    // 获取当前认证用户
    const {
      data: { user },
    } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "未授权操作" }, { status: 401 });
    }
    
    // 1. 从数据库获取任务状态
    const { data, error: taskStatusError } = await supabase
      .from("video_generation_task_statuses")
      .select(`
        id,
        task_id,
        external_task_id,
        status,
        result_url,
        thumbnail_url,
        error_message,
        updated_at,
        video_generation_task_definitions:task_id(
          id,
          prompt,
          negative_prompt,
          model,
          high_quality,
          user_id
        )
      `)
      .eq("external_task_id", externalTaskId)
      .single();
    
    if (taskStatusError || !data) {
      return NextResponse.json({ error: "获取任务状态失败" }, { status: 404 });
    }
    
    const taskStatus = data as unknown as TaskStatus;
    
    // 2. 验证用户是否有权限查看该任务
    if (taskStatus.video_generation_task_definitions.user_id !== user.id) {
      return NextResponse.json({ error: "没有权限查看该任务" }, { status: 403 });
    }
    
    // 3. 如果任务正在处理中，触发一次状态更新（仅在任务状态为 processing 或 pending 时）
    if (["processing", "pending"].includes(taskStatus.status)) {
      try {
        // 调用API获取最新状态
        const response = await fetch(`${process.env.NEXT_PUBLIC_URL || ""}/api/v1/302/tasks/${externalTaskId}/result`);
        
        if (response.ok) {
          const statusData = await response.json();
          
          let newStatus = taskStatus.status;
          let resultUrl = taskStatus.result_url;
          let thumbnailUrl = taskStatus.thumbnail_url;
          let errorMessage = taskStatus.error_message;
          let statusChanged = false;
          
          // 解析状态
          if (statusData.status === 1 || statusData.videoUrl) {
            newStatus = "completed";
            resultUrl = statusData.videoUrl;
            thumbnailUrl = statusData.coverUrl;
            statusChanged = true;
          } else if (statusData.status === -1) {
            newStatus = "failed";
            errorMessage = statusData.error || "视频生成失败";
            statusChanged = true;
          } else if (statusData.status === 5 && taskStatus.status !== "queued") {
            newStatus = "queued";
            statusChanged = true;
          } else if (statusData.status === 10 && taskStatus.status !== "processing") {
            newStatus = "processing";
            statusChanged = true;
          }
          
          // 只有当状态有变化时才更新数据库
          if (statusChanged) {
            await supabase
              .from("video_generation_task_statuses")
              .update({
                status: newStatus,
                result_url: resultUrl,
                thumbnail_url: thumbnailUrl,
                error_message: errorMessage,
                updated_at: new Date().toISOString()
              })
              .eq("id", taskStatus.id);
            
            // 更新返回的状态
            taskStatus.status = newStatus;
            taskStatus.result_url = resultUrl;
            taskStatus.thumbnail_url = thumbnailUrl;
            taskStatus.error_message = errorMessage;
            taskStatus.updated_at = new Date().toISOString();
          }
        }
      } catch (updateError) {
        console.error("更新任务状态失败:", updateError);
        // 即使更新失败，也继续返回当前状态
      }
    }
    
    const taskDefinition = taskStatus.video_generation_task_definitions;
    
    // 4. 返回任务信息
    return NextResponse.json({
      success: true,
      task: {
        id: taskStatus.task_id,
        externalTaskId: taskStatus.external_task_id,
        status: taskStatus.status,
        resultUrl: taskStatus.result_url,
        thumbnailUrl: taskStatus.thumbnail_url,
        errorMessage: taskStatus.error_message,
        updatedAt: taskStatus.updated_at,
        prompt: taskDefinition.prompt,
        negativePrompt: taskDefinition.negative_prompt,
        model: taskDefinition.model,
        highQuality: taskDefinition.high_quality
      }
    });
  } catch (error) {
    console.error("获取视频任务状态失败:", error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
} 