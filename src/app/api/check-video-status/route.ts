import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

const API_KEY = process.env.API_302_KEY;

// 定义任务状态
const TASK_STATUS = {
  QUEUING: 5,
  PROCESSING: 10,
  COMPLETED: 99
};

// 将 302.ai 的状态映射到我们的数据库状态
function mapStatus(status: number): string {
  switch (status) {
    case TASK_STATUS.QUEUING:
      return 'pending';
    case TASK_STATUS.PROCESSING:
      return 'processing';
    case TASK_STATUS.COMPLETED:
      return 'completed';
    default:
      return 'failed';
  }
}

export async function GET(request: Request) {
  // 验证请求是否来自 Vercel Cron
  const authHeader = request.headers.get('x-vercel-cron');
  if (process.env.VERCEL && !authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = await createClient();

    // 获取所有未完成的任务
    const { data: pendingTasks, error: queryError } = await supabase
      .from('video_generation_task_statuses')
      .select(`
        id,
        task_id,
        external_task_id,
        status
      `)
      .not('status', 'eq', 'completed')
      .order('created_at', { ascending: true });

    if (queryError) {
      console.error('Error fetching pending tasks:', queryError);
      return NextResponse.json({ error: 'Failed to fetch pending tasks' }, { status: 500 });
    }

    if (!pendingTasks || pendingTasks.length === 0) {
      return NextResponse.json({ message: 'No pending tasks' });
    }

    // 处理每个待处理的任务
    const updates = await Promise.all(pendingTasks.map(async (task) => {
      if (!task.external_task_id) {
        return null;
      }

      try {
        // 调用 302.ai API 检查任务状态
        const response = await fetch(`https://api.302.ai/klingai/task/${task.external_task_id}/fetch`, {
          headers: {
            'Authorization': `Bearer ${API_KEY}`
          }
        });

        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }

        const responseData = await response.json();
        
        // 确保响应数据符合预期格式
        if (!responseData.data || !responseData.data.task) {
          throw new Error('Invalid response format from 302.ai API');
        }

        const { data } = responseData;
        const status = data.status;
        const dbStatus = mapStatus(status);

        // 准备更新数据
        const updateData: any = {
          status: dbStatus,
          updated_at: new Date().toISOString()
        };

        // 如果任务完成，添加视频和封面URL
        if (status === TASK_STATUS.COMPLETED && data.works && data.works[0]) {
          const work = data.works[0];
          if (work.resource && work.resource.resource) {
            updateData.result_url = work.resource.resource;
          }
          if (work.cover && work.cover.resource) {
            updateData.thumbnail_url = work.cover.resource;
          }
        }

        // 更新数据库中的任务状态
        const { error: updateError } = await supabase
          .from('video_generation_task_statuses')
          .update(updateData)
          .eq('id', task.id);

        if (updateError) {
          console.error('Error updating task status:', updateError);
          return null;
        }

        return {
          task_id: task.id,
          status: dbStatus,
          ...(updateData.result_url && { result_url: updateData.result_url }),
          ...(updateData.thumbnail_url && { thumbnail_url: updateData.thumbnail_url })
        };

      } catch (error) {
        console.error(`Error checking status for task ${task.id}:`, error);
        return null;
      }
    }));

    const successfulUpdates = updates.filter(Boolean);
    return NextResponse.json({
      message: `Processed ${successfulUpdates.length} tasks`,
      updates: successfulUpdates
    });

  } catch (error) {
    console.error('Error in check-video-status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 设置 revalidate 为 0 以禁用缓存
export const revalidate = 0; 