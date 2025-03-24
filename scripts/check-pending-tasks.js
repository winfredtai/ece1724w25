// 检查待处理任务的脚本
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// 打印环境变量检查
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '已设置' : '未设置');
console.log('Supabase Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '已设置' : '未设置');

// 创建 Supabase 客户端 - 使用service_role密钥以绕过RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,  // 使用service_role密钥替代anon密钥
  {
    auth: {
      persistSession: false
    }
  }
);

async function checkPendingTasks() {
  try {
    console.log("开始查询任务...");
    
    // 先查询所有任务，查看总数
    const { data: allTasks, error: allTasksError } = await supabase
      .from("video_generation_task_statuses")
      .select("id, status")
      .limit(10);
    
    if (allTasksError) {
      console.error("查询所有任务失败:", allTasksError);
      return;
    }
    
    console.log(`数据库中共有 ${allTasks?.length || 0} 条任务记录（限制10条）`);
    
    if (allTasks && allTasks.length > 0) {
      // 显示所有状态计数
      const statusCounts = {};
      allTasks.forEach(task => {
        statusCounts[task.status] = (statusCounts[task.status] || 0) + 1;
      });
      console.log("各状态任务数量:", statusCounts);
    }

    // 获取所有处理中的任务 - 尝试不同的查询方式
    console.log("\n方法1: 使用 in 操作符查询");
    const { data: pendingTasks1, error: error1 } = await supabase
      .from("video_generation_task_statuses")
      .select(`id, task_id, external_task_id, status, updated_at`)
      .in("status", ["processing", "pending"])
      .order("updated_at", { ascending: true });
    
    if (error1) {
      console.error("查询方法1失败:", error1);
    } else {
      console.log(`方法1发现 ${pendingTasks1?.length || 0} 个待处理任务`);
    }
    
    console.log("\n方法2: 使用 or 条件查询");
    const { data: pendingTasks2, error: error2 } = await supabase
      .from("video_generation_task_statuses")
      .select(`id, task_id, external_task_id, status, updated_at`)
      .or("status.eq.processing,status.eq.pending")
      .order("updated_at", { ascending: true });
    
    if (error2) {
      console.error("查询方法2失败:", error2);
    } else {
      console.log(`方法2发现 ${pendingTasks2?.length || 0} 个待处理任务`);
    }
    
    console.log("\n方法3: 使用 eq 直接查询 processing 状态");
    const { data: processingTasks, error: error3 } = await supabase
      .from("video_generation_task_statuses")
      .select(`id, task_id, external_task_id, status, updated_at`)
      .eq("status", "processing");
    
    if (error3) {
      console.error("查询方法3失败:", error3);
    } else {
      console.log(`方法3发现 ${processingTasks?.length || 0} 个 processing 状态任务`);
      
      // 打印任务详情
      if (processingTasks && processingTasks.length > 0) {
        processingTasks.forEach((task, index) => {
          console.log(`任务 ${index + 1}:`);
          console.log(`  ID: ${task.id}`);
          console.log(`  任务ID: ${task.task_id}`);
          console.log(`  外部任务ID: ${task.external_task_id}`);
          console.log(`  状态: ${task.status}`);
          console.log(`  最后更新时间: ${task.updated_at}`);
          console.log('-----------------------------------');
        });
      }
    }
    
    console.log("\n方法4: 使用 eq 直接查询 pending 状态");
    const { data: pendingTasks, error: error4 } = await supabase
      .from("video_generation_task_statuses")
      .select(`id, task_id, external_task_id, status, updated_at`)
      .eq("status", "pending");
    
    if (error4) {
      console.error("查询方法4失败:", error4);
    } else {
      console.log(`方法4发现 ${pendingTasks?.length || 0} 个 pending 状态任务`);
    }
    
  } catch (error) {
    console.error("查询待处理任务失败:", error);
  }
}

// 运行函数
checkPendingTasks(); 