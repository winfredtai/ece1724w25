import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

const API_KEY = process.env.API_302_KEY;

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  console.log("Starting video status check...");
  const supabase = await createClient();

  try {
    // 获取所有未完成的任务
    const { data: tasks, error: tasksError } = await supabase
      .from("video_generation_task_statuses")
      .select("*, video_generation_task_definitions(*)")
      .in("status", ["pending", "processing"])
      .order("created_at", { ascending: true });

    if (tasksError) {
      console.error("Error fetching tasks:", tasksError);
      return NextResponse.json({ error: tasksError.message }, { status: 500 });
    }

    console.log(`Found ${tasks?.length || 0} tasks to check`);

    const results = [];
    for (const task of tasks || []) {
      try {
        console.log(
          `Checking task ${task.id} with external ID ${task.external_task_id}...`,
        );

        // 调用302.ai API
        const response = await fetch(
          `https://api.302.ai/klingai/task/${task.external_task_id}/fetch`,
          {
            headers: {
              Authorization: `Bearer ${API_KEY}`,
            },
          },
        );

        if (!response.ok) {
          console.error(
            `API error for task ${task.id}:`,
            response.status,
            response.statusText,
          );
          continue;
        }

        const data = await response.json();
        console.log(
          `API response for task ${task.id}:`,
          JSON.stringify(data, null, 2),
        );

        // 获取状态码
        const statusCode = data.data?.task?.status;
        console.log(`Status code for task ${task.id}:`, statusCode);

        // 解析状态
        let newStatus;
        if (statusCode === 5) {
          newStatus = "pending";
        } else if (statusCode === 10) {
          newStatus = "processing";
        } else if (statusCode === 99) {
          newStatus = "completed";
        } else {
          newStatus = "failed";
        }

        // 获取资源URL
        const resultUrl = data.data?.works?.[0]?.resource?.resource || null;
        const thumbnailUrl = data.data?.works?.[0]?.cover?.resource || null;

        console.log(`Updating task ${task.id} with status:`, {
          newStatus,
          resultUrl,
          thumbnailUrl,
        });

        // 更新数据库
        const { error: updateError } = await supabase
          .from("video_generation_task_statuses")
          .update({
            status: newStatus,
            result_url: resultUrl,
            thumbnail_url: thumbnailUrl,
            updated_at: new Date().toISOString(),
          })
          .eq("id", task.id)
          .select()
          .single();

        if (updateError) {
          console.error(`Error updating task ${task.id}:`, updateError);
          results.push({
            taskId: task.id,
            success: false,
            error: updateError.message,
          });
        } else {
          console.log(`Successfully updated task ${task.id}`);
          results.push({
            taskId: task.id,
            success: true,
            newStatus,
            resultUrl,
            thumbnailUrl,
          });
        }
      } catch (error) {
        console.error(`Error processing task ${task.id}:`, error);
        results.push({
          taskId: task.id,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      message: "Status check completed",
      results,
    });
  } catch (error) {
    console.error("Error in status check:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
