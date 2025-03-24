import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  // 检查环境变量
  const envInfo = {
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseUrlPrefix: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 15) + "...",
    hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    serviceRoleKeyPrefix: process.env.SUPABASE_SERVICE_ROLE_KEY ? 
      process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 5) + "..." : null,
    hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    hasNextPublicUrl: !!process.env.NEXT_PUBLIC_URL,
    nextPublicUrl: process.env.NEXT_PUBLIC_URL,
    nodeEnv: process.env.NODE_ENV
  };
  
  let dbResults: {
    connected: boolean;
    error: string | null;
    counts: Record<string, any>;
  } = { connected: false, error: null, counts: {} };
  
  try {
    // 尝试连接数据库
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "",
      {
        auth: { persistSession: false }
      }
    );
    
    // 尝试获取所有任务表的计数
    const tables = ["video_generation_task_definitions", "video_generation_task_statuses"];
    const counts: Record<string, any> = {};
    
    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select("*", { count: "exact", head: true });
        
        counts[table] = { count, error: error?.message };
      } catch (e) {
        counts[table] = { error: e instanceof Error ? e.message : String(e) };
      }
    }
    
    // 尝试获取pending和processing状态的任务
    let pendingTasksCount = 0;
    try {
      const { count, error } = await supabase
        .from("video_generation_task_statuses")
        .select("*", { count: "exact", head: true })
        .in("status", ["processing", "pending"]);
      
      pendingTasksCount = count || 0;
      
      // 如果有处理中的任务，获取前5个
      if (pendingTasksCount > 0) {
        const { data: pendingTasks, error: taskError } = await supabase
          .from("video_generation_task_statuses")
          .select("id, external_task_id, status, updated_at")
          .in("status", ["processing", "pending"])
          .limit(5);
        
        counts["pending_tasks_sample"] = pendingTasks || [];
      }
    } catch (e) {
      counts["pending_tasks_error"] = e instanceof Error ? e.message : String(e);
    }
    
    dbResults = {
      connected: true,
      counts: {
        ...counts,
        pendingTasksCount
      },
      error: null
    };
  } catch (error) {
    dbResults = {
      connected: false,
      counts: {},
      error: error instanceof Error ? error.message : String(error)
    };
  }
  
  return NextResponse.json({ 
    timestamp: new Date().toISOString(),
    env: envInfo,
    db: dbResults
  });
} 