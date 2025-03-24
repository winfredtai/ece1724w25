import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  
  try {
    // 获取当前认证用户
    const {
      data: { user },
    } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "未授权操作" }, { status: 401 });
    }
    
    // 解析请求数据
    const taskData = await request.json();
    
    // 1. 创建任务定义
    const { data: taskDef, error: taskDefError } = await supabase
      .from("video_generation_task_definitions")
      .insert({
        user_id: user.id,
        prompt: taskData.prompt,
        negative_prompt: taskData.negative_prompt,
        cfg: taskData.cfg,
        aspect_ratio: taskData.aspect_ratio,
        model: taskData.model,
        high_quality: taskData.high_quality,
        task_type: taskData.task_type || "video",
        credits: taskData.high_quality ? 2 : 1, // 根据质量设置积分消耗
        start_img_path: taskData.start_img_path || null,
        end_img_path: taskData.end_img_path || null
      })
      .select("id")
      .single();
    
    if (taskDefError) throw taskDefError;
    
    // 2. 创建任务状态记录
    const { data: taskStatus, error: taskStatusError } = await supabase
      .from("video_generation_task_statuses")
      .insert({
        task_id: taskDef.id,
        external_task_id: taskData.external_task_id,
        status: "processing",
      })
      .select("id")
      .single();
    
    if (taskStatusError) throw taskStatusError;
    
    // 3. 可选：更新用户积分
    // TODO: 实现扣除用户积分的逻辑
    
    return NextResponse.json({ 
      success: true, 
      taskId: taskDef.id,
      taskStatusId: taskStatus.id,
      externalTaskId: taskData.external_task_id 
    });
  } catch (error) {
    console.error("保存视频任务失败:", error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
} 