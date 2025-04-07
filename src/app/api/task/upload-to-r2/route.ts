import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { uploadFileFromUrl, generateStorageKey } from "@/utils/r2Storage";
import { Tables } from "@/types/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Upload video and thumbnail to R2 storage.
 *
 * This endpoint can handle both single task uploads and batch scans.
 * Single task upload requires taskId, userId, videoUrl, and thumbnailUrl.
 * Batch scan will process all completed tasks with pending/failed R2 uploads.
 *
 * @param request The request object containing the task details.
 * @returns A JSON response with the result of the upload.
 */
export async function POST(request: Request) {
  const log = (message: string, data?: unknown) => {
    const timestamp = new Date().toISOString();
    console.log(
      `[${timestamp}][UPLOAD-R2] ${message}`,
      data ? JSON.stringify(data, null, 2) : "",
    );
  };

  try {
    // Check if this is a single task upload or a batch scan
    let isBatchScan = false;
    let taskId, userId, videoUrl, thumbnailUrl;

    try {
      const body = await request.json();
      ({ taskId, userId, videoUrl, thumbnailUrl } = body);
    } catch {
      // If no valid JSON body is provided, assume this is a batch scan request
      isBatchScan = true;
      log("No request body provided, running batch scan for pending uploads");
    }

    const supabase = await createClient();

    // BATCH SCAN MODE: Process all completed tasks with pending/failed R2 uploads
    if (isBatchScan) {
      // log("Starting batch scan for videos to upload to R2");

      // Find all tasks that are completed with result_url but pending/failed R2 upload
      const { data: tasks, error: queryError } = (await supabase
        .from("video_generation_task_statuses")
        .select("*, video_generation_task_definitions(*)")
        .eq("status", "completed")
        .not("result_url", "is", null)
        .or("r2_status.eq.pending,r2_status.eq.failed,r2_status.is.null")
        .limit(10)) as {
        data:
          | (Tables<"video_generation_task_statuses"> & {
              video_generation_task_definitions: Tables<"video_generation_task_definitions">;
            })[]
          | null;
        error: Error | null;
      };

      if (queryError) {
        log("Error fetching tasks for batch upload", queryError);
        return NextResponse.json(
          {
            error: "Failed to fetch tasks for batch upload",
            details: queryError,
          },
          { status: 500 },
        );
      }

      // log("Tasks found for batch upload", tasks);

      if (!tasks || tasks.length === 0) {
        log("No tasks found for batch upload");
        return NextResponse.json({
          success: true,
          message: "No tasks found for batch upload",
          data: { tasksProcessed: 0 },
        });
      }

      // log(`Found ${tasks.length} tasks for batch upload`);

      // Process each task
      const results = [];
      for (const task of tasks) {
        try {
          // Mark as uploading
          await supabase
            .from("video_generation_task_statuses")
            .update({
              r2_status: "uploading",
              updated_at: new Date().toISOString(),
            })
            .eq("task_id", task.task_id);

          // log(`Processing task ${task.task_id}`, {
          //   userId: task.video_generation_task_definitions.user_id,
          // });

          // Upload video to R2
          const userId = task.video_generation_task_definitions.user_id;
          const taskId = task.task_id;
          const videoUrl = task.result_url;
          const thumbnailUrl = task.thumbnail_url;

          if (!videoUrl) {
            log(`Task ${taskId} has no result_url, skipping`);
            await supabase
              .from("video_generation_task_statuses")
              .update({
                r2_status: "failed",
                updated_at: new Date().toISOString(),
              })
              .eq("task_id", taskId);
            continue;
          }

          // Upload video
          // log(`Uploading video for task ${taskId}`, { videoUrl });
          // Ensure videoUrl is a string
          if (!videoUrl) {
            throw new Error("Video URL is null or empty");
          }

          const videoKey = generateStorageKey(
            userId as string,
            taskId.toString(),
            "video",
            "mp4",
          );
          let r2VideoUrl = null;
          let r2ThumbnailUrl = null;

          try {
            r2VideoUrl = await uploadFileFromUrl(
              videoUrl,
              videoKey,
              "video/mp4",
            );
            // log(`Video uploaded successfully for task ${taskId}`, {
            //   r2VideoUrl,
            // });

            // Upload thumbnail if available
            if (thumbnailUrl) {
              // log(`Uploading thumbnail for task ${taskId}`, { thumbnailUrl });
              const thumbnailKey = generateStorageKey(
                userId as string,
                taskId.toString(),
                "thumbnail",
                "jpg",
              );
              r2ThumbnailUrl = await uploadFileFromUrl(
                thumbnailUrl,
                thumbnailKey,
                "image/jpeg",
              );
              // log(`Thumbnail uploaded successfully for task ${taskId}`, {
              //   r2ThumbnailUrl,
              // });
            }

            // Update task with success status
            await supabase
              .from("video_generation_task_statuses")
              .update({
                result_url: r2VideoUrl,
                thumbnail_url: r2ThumbnailUrl,
                r2_status: "completed",
                updated_at: new Date().toISOString(),
              })
              .eq("task_id", taskId);

            results.push({
              taskId,
              success: true,
              r2VideoUrl,
              r2ThumbnailUrl,
            });
          } catch (uploadError) {
            log(`Error uploading files for task ${taskId}`, uploadError);

            // Mark as failed
            await supabase
              .from("video_generation_task_statuses")
              .update({
                r2_status: "failed",
                updated_at: new Date().toISOString(),
              })
              .eq("task_id", taskId);

            results.push({
              taskId,
              success: false,
              error:
                uploadError instanceof Error
                  ? uploadError.message
                  : "Upload failed",
            });
          }
        } catch (taskError) {
          log(`Error processing task ${task.task_id}`, taskError);
          results.push({
            taskId: task.task_id,
            success: false,
            error:
              taskError instanceof Error
                ? taskError.message
                : "Task processing failed",
          });
        }
      }

      // log("Batch upload completed", {
      //   total: tasks.length,
      //   succeeded: results.filter((r) => r.success).length,
      //   failed: results.filter((r) => !r.success).length,
      // });

      return NextResponse.json({
        success: true,
        message: "Batch upload completed",
        data: {
          tasksProcessed: tasks.length,
          results,
        },
      });
    }

    // SINGLE TASK MODE: Process a specific task
    if (!taskId || !userId || !videoUrl) {
      log("Missing required parameters", { taskId, userId, videoUrl });
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 },
      );
    }

    log("Starting R2 upload process for single task", { taskId, userId });

    // Get task details
    const { data: task, error: taskError } = await supabase
      .from("video_generation_task_statuses")
      .select("*, video_generation_task_definitions(*)")
      .eq("task_id", taskId)
      .single();

    if (taskError || !task) {
      log("Error fetching task", taskError);
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Mark as uploading
    await supabase
      .from("video_generation_task_statuses")
      .update({
        r2_status: "uploading",
        updated_at: new Date().toISOString(),
      })
      .eq("task_id", taskId);

    try {
      // Upload video to R2
      // log("Uploading video to R2", { videoUrl });
      // Ensure videoUrl is a string
      if (!videoUrl) {
        throw new Error("Video URL is null or empty");
      }

      const videoKey = generateStorageKey(
        userId as string,
        taskId.toString(),
        "video",
        "mp4",
      );
      const r2VideoUrl = await uploadFileFromUrl(
        videoUrl,
        videoKey,
        "video/mp4",
      );
      // log("Video uploaded successfully", { r2VideoUrl });

      // Upload thumbnail to R2 if available
      let r2ThumbnailUrl = null;
      if (thumbnailUrl) {
        // log("Uploading thumbnail to R2", { thumbnailUrl });
        const thumbnailKey = generateStorageKey(
          userId as string,
          taskId.toString(),
          "thumbnail",
          "jpg",
        );
        r2ThumbnailUrl = await uploadFileFromUrl(
          thumbnailUrl,
          thumbnailKey,
          "image/jpeg",
        );
        // log("Thumbnail uploaded successfully", { r2ThumbnailUrl });
      }

      // Update task status with R2 URLs and completed status
      const { data: updatedTask, error: updateError } = await supabase
        .from("video_generation_task_statuses")
        .update({
          result_url: r2VideoUrl,
          thumbnail_url: r2ThumbnailUrl,
          r2_status: "completed",
          updated_at: new Date().toISOString(),
        })
        .eq("task_id", taskId)
        .select()
        .single();

      if (updateError) {
        log("Error updating task with R2 URLs", updateError);
        return NextResponse.json(
          {
            error: "Failed to update task with R2 URLs",
            details: updateError,
          },
          { status: 500 },
        );
      }

      log("Task updated with R2 URLs", updatedTask);

      return NextResponse.json({
        success: true,
        message: "Files uploaded to R2 successfully",
        data: {
          taskId,
          r2VideoUrl,
          r2ThumbnailUrl,
        },
      });
    } catch (uploadError) {
      // log("Error during upload", uploadError);

      // Mark as failed
      await supabase
        .from("video_generation_task_statuses")
        .update({
          r2_status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("task_id", taskId);

      return NextResponse.json(
        {
          error:
            uploadError instanceof Error
              ? uploadError.message
              : "Upload failed",
          details: uploadError,
        },
        { status: 500 },
      );
    }
  } catch (error) {
    log("Unexpected error", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Server internal error",
        details: error,
      },
      { status: 500 },
    );
  }
}
