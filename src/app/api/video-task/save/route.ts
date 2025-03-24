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
      return NextResponse.json({ success: false, error: "未授权操作" }, { status: 401 });
    }
    
    // 解析请求数据
    const taskData = await request.json();
    
    // 打印请求数据用于调试
    console.log("接收到的任务数据:", JSON.stringify(taskData, null, 2));
    console.log("当前用户:", user.id);
    
    // 确保必要字段存在
    if (!taskData.external_task_id) {
      return NextResponse.json({ success: false, error: "缺少external_task_id" }, { status: 400 });
    }
    
    if (!taskData.prompt) {
      return NextResponse.json({ success: false, error: "缺少prompt" }, { status: 400 });
    }
    
    // 设置 Supabase 绕过 RLS
    const adminSupabase = supabase.auth.admin;
    if (!adminSupabase) {
      console.log("使用普通客户端，可能受RLS限制");
    } else {
      console.log("使用管理员客户端，将绕过RLS");
    }
    
    // 1. 创建任务定义
    const { data: taskDef, error: taskDefError } = await supabase
      .from("video_generation_task_definitions")
      .insert({
        user_id: user.id,
        prompt: taskData.prompt,
        negative_prompt: taskData.negative_prompt || "",
        cfg: typeof taskData.cfg === 'number' ? taskData.cfg : parseFloat(taskData.cfg || "0.5"),
        aspect_ratio: taskData.aspect_ratio || "1:1",
        model: taskData.model || "kling",
        high_quality: !!taskData.high_quality,
        task_type: taskData.task_type || "video",
        credits: taskData.high_quality ? 2 : 1, // 根据质量设置积分消耗
        start_img_path: taskData.start_img_path || "", // 使用空字符串代替null
        end_img_path: taskData.end_img_path || ""  // 使用空字符串代替null
      })
      .select("id")
      .single();
    
    if (taskDefError) {
      console.error("创建任务定义失败:", taskDefError.message, taskDefError.details, taskDefError.hint);
      
      // 检查是否是RLS错误并提供更明确的错误消息
      if (taskDefError.message.includes("row-level security")) {
        return NextResponse.json({ 
          success: false, 
          error: "数据库权限错误：当前用户无权创建任务记录。请联系管理员修改RLS策略。",
          details: taskDefError.message
        }, { status: 403 });
      }
      
      return NextResponse.json({ 
        success: false, 
        error: taskDefError.message,
        details: taskDefError.details || taskDefError.hint || "未知数据库错误"
      }, { status: 500 });
    }
    
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
    
    if (taskStatusError) {
      console.error("创建任务状态记录失败:", taskStatusError.message, taskStatusError.details);
      return NextResponse.json({ 
        success: false, 
        error: taskStatusError.message,
        details: taskStatusError.details || "创建任务状态记录失败"
      }, { status: 500 });
    }
    
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
    const errorMessage = error instanceof Error 
      ? error.message 
      : typeof error === 'object' 
        ? JSON.stringify(error) 
        : String(error);
    
    return NextResponse.json({ 
      success: false, 
      error: errorMessage
    }, { status: 500 });
  }
} 