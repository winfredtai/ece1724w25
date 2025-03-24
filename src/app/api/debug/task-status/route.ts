import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  
  try {
    // 查询所有任务（最多前100条），以了解整体情况
    const { data: allTasks, error: allTasksError } = await supabase
      .from("video_generation_task_statuses")
      .select("id, status")
      .limit(100);
    
    if (allTasksError) {
      return NextResponse.json({ 
        success: false, 
        error: `查询所有任务失败: ${allTasksError.message}`
      }, { status: 500 });
    }
    
    // 统计各状态任务数量
    const statusCounts: Record<string, number> = {};
    if (allTasks && allTasks.length > 0) {
      allTasks.forEach(task => {
        const status = task.status as string;
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
    }
    
    // 查询所有待处理的任务（processing 和 pending）
    const { data: pendingTasks, error: pendingError } = await supabase
      .from("video_generation_task_statuses")
      .select(`
        id,
        task_id,
        external_task_id,
        status,
        updated_at,
        created_at,
        result_url,
        thumbnail_url,
        error_message
      `)
      .in("status", ["processing", "pending"])
      .order("updated_at", { ascending: true });
    
    if (pendingError) {
      return NextResponse.json({ 
        success: false, 
        error: `查询待处理任务失败: ${pendingError.message}`
      }, { status: 500 });
    }
    
    // 单独查询 processing 状态的任务
    const { data: processingTasks, error: processingError } = await supabase
      .from("video_generation_task_statuses")
      .select(`id, task_id, external_task_id, status`)
      .eq("status", "processing");
    
    if (processingError) {
      return NextResponse.json({ 
        success: false, 
        error: `查询 processing 任务失败: ${processingError.message}`
      }, { status: 500 });
    }
    
    // 单独查询 pending 状态的任务
    const { data: pendingOnlyTasks, error: pendingOnlyError } = await supabase
      .from("video_generation_task_statuses")
      .select(`id, task_id, external_task_id, status`)
      .eq("status", "pending");
    
    if (pendingOnlyError) {
      return NextResponse.json({ 
        success: false, 
        error: `查询 pending 任务失败: ${pendingOnlyError.message}`
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      totalTasks: allTasks?.length || 0,
      statusCounts,
      pendingTasksCount: pendingTasks?.length || 0,
      pendingTasks: pendingTasks || [],
      processingTasksCount: processingTasks?.length || 0,
      pendingOnlyTasksCount: pendingOnlyTasks?.length || 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("查询任务状态失败:", error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
} 