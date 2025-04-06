import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const API_BASE_URL = process.env.KLING_BASE_URL || "https://api.klingai.com";
const ACCESS_KEY_ID = process.env.KLING_ACCESS_KEY_ID || "";
const ACCESS_KEY_SECRET = process.env.KLING_ACCESS_KEY_SECRET || "";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Generate JWT token for Kling API authentication
 * @param accessKeyId - The access key ID
 * @param accessKeySecret - The access key secret
 * @returns The JWT token
 */
function generateJwtToken(
  accessKeyId: string,
  accessKeySecret: string,
): string {
  const headers = {
    alg: "HS256",
    typ: "JWT",
  };

  const payload = {
    iss: accessKeyId,
    exp: Math.floor(Date.now() / 1000) + 1800, // Valid for 30 minutes
    nbf: Math.floor(Date.now() / 1000) - 5, // Valid from 5 seconds ago
  };

  return jwt.sign(payload, accessKeySecret, { header: headers });
}

/**
 * Update the status of unfinished Kling official text2video tasks.
 * @returns A JSON response with the result of the update
 */
export async function GET() {
  const log = (message: string, data?: unknown) => {
    const timestamp = new Date().toISOString();
    console.log(
      `[${timestamp}][UPDATE-KLING-I2V] ${message}`,
      data ? JSON.stringify(data, null, 2) : "",
    );
  };

  try {
    // log("Starting Kling official text2video status update...");

    if (!ACCESS_KEY_ID || !ACCESS_KEY_SECRET) {
      log("Missing Kling API credentials");
      return NextResponse.json(
        { error: "Missing Kling API credentials" },
        { status: 500 },
      );
    }

    const supabase = await createClient();

    // Generate JWT token for authentication
    const jwtToken = generateJwtToken(ACCESS_KEY_ID, ACCESS_KEY_SECRET);
    // log("JWT token generated successfully");

    // Fetch processing and pending Kling video tasks
    const { data: tasks, error: tasksError } = await supabase
      .from("video_generation_task_statuses")
      .select("*, video_generation_task_definitions(*)")
      .in("status", ["processing", "pending", "queued"])
      .eq("video_generation_task_definitions.model", "kling") // Only process Kling official video tasks
      .order("updated_at", { ascending: true })
      .limit(10); // Process in batches

    if (tasksError) {
      log("Error fetching tasks", tasksError);
      return NextResponse.json({ error: tasksError.message }, { status: 500 });
    }

    // log(`Found ${tasks?.length || 0} tasks to check`);

    const results = [];
    const processedCount = tasks?.length || 0;
    let successCount = 0;
    let failCount = 0;

    // Process each task
    for (const task of tasks || []) {
      try {
        // Check if task is using official Kling website
        let isOfficialKling = false;
        const taskApiEndpoint =
          task.video_generation_task_definitions.additional_params
            ?.api_endpoint;

        if (taskApiEndpoint && taskApiEndpoint.includes(API_BASE_URL)) {
          isOfficialKling = true;
        }

        // log("Task details", {
        //   taskId: task.id,
        //   externalTaskId: task.external_task_id,
        //   currentStatus: task.status,
        //   taskType: task.video_generation_task_definitions.task_type,
        //   apiEndpoint: taskApiEndpoint,
        //   isOfficialKling
        // });

        // Skip if not an official Kling task
        if (!isOfficialKling) {
          // log("Skipping non-official Kling task", { taskId: task.id });
          continue;
        }

        // Check for timeout based on time
        if (task.status === "processing") {
          const updatedAt = new Date(task.updated_at);
          const hoursSinceUpdate =
            (Date.now() - updatedAt.getTime()) / (1000 * 60 * 60);

          if (hoursSinceUpdate > 24) {
            // Task processing for over 24 hours, mark as failed
            // log("Task processing timeout", {
            //   taskId: task.id,
            //   hoursSinceUpdate
            // });

            await supabase
              .from("video_generation_task_statuses")
              .update({
                status: "failed",
                error_message: "任务处理超时，可能卡住",
                updated_at: new Date().toISOString(),
              })
              .eq("id", task.id);

            successCount++;
            results.push({
              taskId: task.id,
              success: true,
              newStatus: "failed",
              reason: "timeout_without_api_call",
            });

            continue;
          }
        }

        // Call Kling API to get task status
        const taskUrl = `${API_BASE_URL}/v1/videos/text2video?pageNum=1&pageSize=100`;
        // log("Calling Kling API", { url: taskUrl });

        const response = await fetch(taskUrl, {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          log("API error", {
            status: response.status,
            statusText: response.statusText,
          });

          // Use fallback logic for failed API calls
          const updatedAt = new Date(task.updated_at);
          const hoursSinceUpdate =
            (Date.now() - updatedAt.getTime()) / (1000 * 60 * 60);

          if (task.status === "processing" && hoursSinceUpdate > 24) {
            // If processing for over 24 hours, mark as failed
            await supabase
              .from("video_generation_task_statuses")
              .update({
                status: "failed",
                error_message: "任务处理超过24小时未完成，可能失败",
                updated_at: new Date().toISOString(),
              })
              .eq("id", task.id);

            successCount++;
          } else if (task.status === "queued" && hoursSinceUpdate > 6) {
            // If queued for over 6 hours, assume processing has started
            await supabase
              .from("video_generation_task_statuses")
              .update({
                status: "processing",
                updated_at: new Date().toISOString(),
              })
              .eq("id", task.id);

            successCount++;
          }

          continue;
        }

        const apiResponse = await response.json();
        // log("API response received", { responseSize: JSON.stringify(apiResponse).length });

        // Find the matching task in the response
        let foundTask = null;
        if (apiResponse.data && apiResponse.data.length > 0) {
          for (const item of apiResponse.data) {
            if (item.task_id === task.external_task_id) {
              foundTask = item;
              break;
            }
          }
        }

        if (!foundTask) {
          log("Task not found in API response", {
            externalTaskId: task.external_task_id,
          });
          continue;
        }

        // Parse the task status
        const apiStatus = foundTask.task_status;
        let newStatus = task.status;
        let resultUrl = task.result_url;
        let thumbnailUrl = task.thumbnail_url;
        let errorMessage = task.error_message;

        // Update status based on API response
        switch (apiStatus) {
          case "succeed":
            newStatus = "completed";
            if (
              foundTask.task_result?.videos &&
              foundTask.task_result.videos.length > 0
            ) {
              resultUrl = foundTask.task_result.videos[0].url;
              thumbnailUrl = null;
            }
            break;
          case "failed":
            newStatus = "failed";
            errorMessage = foundTask.task_status_msg;
            break;
          case "submitted":
            newStatus = "queued";
            break;
          case "processing":
            newStatus = "processing";
            break;
        }

        // log("Status parsed", {
        //   apiStatus,
        //   newStatus,
        //   resultUrl,
        //   thumbnailUrl
        // });

        // Update database if status changed or we have a new result URL
        if (newStatus !== task.status || resultUrl !== task.result_url) {
          const { error: updateError } = await supabase
            .from("video_generation_task_statuses")
            .update({
              status: newStatus,
              result_url: resultUrl,
              thumbnail_url: thumbnailUrl,
              error_message: errorMessage,
              updated_at: new Date().toISOString(),
            })
            .eq("id", task.id);

          if (updateError) {
            log("Error updating task", {
              taskId: task.id,
              error: updateError.message,
            });
            failCount++;
          } else {
            // log("Successfully updated task", {
            //   taskId: task.id,
            //   newStatus,
            //   resultUrl
            // });
            successCount++;
          }
        } else {
          // log("No update needed", { taskId: task.id });
        }

        results.push({
          taskId: task.id,
          success: true,
          newStatus,
          resultUrl,
          thumbnailUrl,
        });
      } catch (error) {
        log("Error processing task", {
          taskId: task.id,
          error: error instanceof Error ? error.message : "Unknown error",
        });
        failCount++;
        results.push({
          taskId: task.id,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }

      // Add a small delay between tasks to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    return NextResponse.json({
      success: true,
      processed: processedCount,
      updated: successCount,
      failed: failCount,
      duration_seconds: 0, // Not tracking exact duration
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (error) {
    log("Unexpected error", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Server internal error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
