/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";

const API_BASE_URL = process.env.KLING_BASE_URL || "https://api.klingai.com";
const ACCESS_KEY_ID = process.env.KLING_ACCESS_KEY_ID || "";
const ACCESS_KEY_SECRET = process.env.KLING_ACCESS_KEY_SECRET || "";
const API_302_KEY = process.env.API_302_KEY || "";

// 获取任务类型的函数
function getTaskProvider(apiEndpoint: string | null | undefined): string {
  if (!apiEndpoint) return "unknown";

  if (apiEndpoint.startsWith("https://api.klingai.com")) {
    return "official";
  } else if (apiEndpoint.startsWith("https://api.302.ai")) {
    return "302";
  }

  return "unknown";
}

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

// 定义类型
interface TaskStatus {
  id: number;
  task_id: number;
  external_task_id: string;
  status: string;
  result_url: string | null;
  thumbnail_url: string | null;
  error_message: string | null;
  updated_at: string;
  video_generation_task_definitions: {
    id: number;
    model: string;
    task_type: string;
    additional_params?: {
      api_endpoint?: string | null;
      [key: string]: any;
    };
    [key: string]: any;
  };
  [key: string]: any;
}

interface TaskResult {
  taskId: number;
  success: boolean;
  newStatus?: string;
  resultUrl?: string | null;
  thumbnailUrl?: string | null;
  error?: string;
  reason?: string;
}

interface CountRef {
  value: number;
}

// 添加302.ai API响应的类型定义
interface API302Response {
  data?: {
    status?: number;
    currentTimestamp?: number;
    message?: string;
    modelErrCode?: string;
    task?: {
      id: string;
      status: number;
    };
    works?: Array<{
      resource?: {
        resource?: string;
        duration?: number;
        height?: number;
        width?: number;
      };
      cover?: {
        resource?: string;
        height?: number;
        width?: number;
      };
      status?: number;
      createTime?: number;
    }>;
  };
  error?: string | null;
  message?: string;
  result: number;
  status: number;
  timestamp: number;
}

// 添加302.ai 图生视频API响应的类型定义
interface API302I2VResponse {
  data?: {
    currentTimestamp?: number;
    etaTime?: number;
    message?: string;
    modelErrCode?: string;
    status?: number;
    task?: {
      id: string;
      status: number;
      createTime?: number;
      type?: string;
      taskInfo?: {
        type?: string;
        inputs?: Array<{
          url?: string;
          inputType?: string;
        }>;
      };
    };
    works?: Array<{
      resource?: {
        resource?: string;
        duration?: number;
        height?: number;
        width?: number;
      };
      cover?: {
        resource?: string;
        height?: number;
        width?: number;
      };
      status?: number;
      createTime?: number;
    }>;
  };
  error?: string | null;
  message?: string;
  result: number;
  status: number;
  timestamp: number;
}

// 添加Kling官方API响应的类型定义
interface KlingAPIResponse {
  data?: Array<{
    task_id: string;
    task_status: string;
    task_status_msg?: string;
    task_result?: {
      videos?: Array<{
        url: string;
      }>;
    };
  }>;
  total_count?: number;
}

/**
 * 处理302.ai的任务状态更新
 */
async function handle302Task(
  task: TaskStatus,
  supabase: SupabaseClient<Database>,
  log: (message: string, data?: unknown) => void,
  results: TaskResult[],
  successCount: CountRef,
  failCount: CountRef,
) {
  try {
    // 检查API key
    if (!API_302_KEY) {
      log("Missing 302.ai API key");
      return;
    }

    // 检查任务类型，确定是文生视频还是图生视频
    const taskType = task.video_generation_task_definitions.task_type;
    const isI2V = taskType === "i2v"; // 图生视频任务

    log("Processing 302.ai task", {
      taskId: task.id,
      externalTaskId: task.external_task_id,
      taskType,
      isI2V,
      task_additional_params:
        task.video_generation_task_definitions.additional_params || {},
    });

    // 构建任务URL
    const taskUrl = `https://api.302.ai/klingai/task/${task.external_task_id}/fetch`;
    log("Calling 302.ai API", { taskId: task.external_task_id, url: taskUrl });

    // 发送请求获取任务状态
    const response = await fetch(taskUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${API_302_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      log("302.ai API error", {
        status: response.status,
        statusText: response.statusText,
      });

      // 使用备用逻辑处理API失败的情况
      handleApiFailure(task, supabase, log, successCount);
      return;
    }

    // 根据任务类型解析响应
    const jsonResponse = await response.json();

    log("302.ai raw response", {
      taskId: task.external_task_id,
      response: jsonResponse,
    });

    // 解析任务状态
    let newStatus = task.status;
    let resultUrl = task.result_url;
    let thumbnailUrl = task.thumbnail_url;
    let errorMessage = task.error_message;

    if (isI2V) {
      // 图生视频处理逻辑
      const apiResponse = jsonResponse as API302I2VResponse;

      log("302.ai I2V API response received", {
        taskId: task.external_task_id,
        status: apiResponse.data?.status,
        taskStatus: apiResponse.data?.task?.status,
      });

      // 更新状态基于302.ai的图生视频响应
      if (apiResponse.result === 1) {
        // 首先尝试从data.task.status获取状态
        let status = apiResponse.data?.task?.status;

        // 如果不存在，则尝试从data.status获取
        if (status === undefined) {
          status = apiResponse.data?.status;
        }

        switch (status) {
          case 99: // 完成
            newStatus = "completed";

            // 从返回数据中提取视频和缩略图URL
            if (apiResponse.data?.works && apiResponse.data.works.length > 0) {
              const work = apiResponse.data.works[0];
              resultUrl = work.resource?.resource || resultUrl;
              thumbnailUrl = work.cover?.resource || thumbnailUrl;
            }
            break;
          case 0: // 等待中
          case 5: // 另一种等待中状态
            newStatus = "queued";
            break;
          case 1: // 处理中
          case 2: // 处理中的另一种状态
            newStatus = "processing";
            break;
          case -1: // 失败
            newStatus = "failed";
            errorMessage = apiResponse.data?.message || "任务处理失败";
            break;
          default:
            // 默认保持当前状态
            log("Unknown 302.ai I2V status", { status });
            break;
        }
      } else {
        // API返回错误
        log(
          "302.ai I2V API returned error",
          apiResponse.error || apiResponse.message,
        );

        if (apiResponse.status >= 400) {
          // 处理API错误
          handleApiFailure(task, supabase, log, successCount);
          return;
        }
      }
    } else {
      // 文生视频处理逻辑（保持现有逻辑）
      const apiResponse = jsonResponse as API302Response;

      log("302.ai API response received", {
        taskId: task.external_task_id,
        status: apiResponse.data?.status,
      });

      // 更新状态基于302.ai的响应
      if (apiResponse.result === 1) {
        const status = apiResponse.data?.status;

        switch (status) {
          case 99: // 完成
            newStatus = "completed";

            // 从返回数据中提取视频和缩略图URL
            if (apiResponse.data?.works && apiResponse.data.works.length > 0) {
              const work = apiResponse.data.works[0];
              resultUrl = work.resource?.resource || resultUrl;
              thumbnailUrl = work.cover?.resource || thumbnailUrl;
            }
            break;
          case 0: // 等待中
          case 5: // 另一种等待中状态
            newStatus = "queued";
            break;
          case 1: // 处理中
          case 2: // 处理中的另一种状态
            newStatus = "processing";
            break;
          case -1: // 失败
            newStatus = "failed";
            errorMessage = "任务处理失败";
            break;
          default:
            // 默认保持当前状态
            break;
        }
      } else {
        // API返回错误
        log(
          "302.ai API returned error",
          apiResponse.error || apiResponse.message,
        );

        if (apiResponse.status >= 400) {
          // 处理API错误
          handleApiFailure(task, supabase, log, successCount);
          return;
        }
      }
    }

    // 更新数据库
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
        log("Error updating 302.ai task", {
          taskId: task.id,
          error: updateError.message,
        });
        failCount.value++;
      } else {
        log("Successfully updated 302.ai task", {
          taskId: task.id,
          newStatus,
          resultUrl,
        });
        successCount.value++;
      }
    } else {
      log("No update needed for 302.ai task", { taskId: task.id });
    }

    results.push({
      taskId: task.id,
      success: true,
      newStatus,
      resultUrl,
      thumbnailUrl,
    });
  } catch (error) {
    log("Error processing 302.ai task", {
      taskId: task.id,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    failCount.value++;
    results.push({
      taskId: task.id,
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * 处理API调用失败的情况
 */
async function handleApiFailure(
  task: TaskStatus,
  supabase: SupabaseClient<Database>,
  log: (message: string, data?: unknown) => void,
  successCount: CountRef,
) {
  const updatedAt = new Date(task.updated_at);
  const hoursSinceUpdate =
    (Date.now() - updatedAt.getTime()) / (1000 * 60 * 60);

  if (task.status === "processing" && hoursSinceUpdate > 24) {
    // 如果处理超过24小时，标记为失败
    await supabase
      .from("video_generation_task_statuses")
      .update({
        status: "failed",
        error_message: "任务处理超过24小时未完成，可能失败",
        updated_at: new Date().toISOString(),
      })
      .eq("id", task.id);

    successCount.value++;
  } else if (task.status === "queued" && hoursSinceUpdate > 6) {
    // 如果排队超过6小时，假设处理已开始
    await supabase
      .from("video_generation_task_statuses")
      .update({
        status: "processing",
        updated_at: new Date().toISOString(),
      })
      .eq("id", task.id);

    successCount.value++;
  }
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
    const { data: tasks, error: tasksError } = (await supabase
      .from("video_generation_task_statuses")
      .select("*, video_generation_task_definitions(*)")
      .in("status", ["processing", "pending", "queued"])
      .eq("video_generation_task_definitions.model", "kling") // Only process Kling official video tasks
      .order("updated_at", { ascending: true })
      .limit(10)) as {
      data: TaskStatus[] | null;
      error: Error | null;
    }; // Process in batches

    if (tasksError) {
      log("Error fetching tasks", tasksError);
      return NextResponse.json({ error: tasksError.message }, { status: 500 });
    }

    // log(`Found ${tasks?.length || 0} tasks to check`);

    const results: TaskResult[] = [];
    const processedCount = tasks?.length || 0;
    const successCountRef = { value: 0 };
    const failCountRef = { value: 0 };

    // Process each task
    for (const task of tasks || []) {
      try {
        // 获取任务类型
        const taskType = task.video_generation_task_definitions.task_type;
        const isI2V = taskType === "i2v"; // 图生视频任务

        // Check if task is using supported Kling models
        let isOfficialKling = false;
        const taskApiEndpoint =
          task.video_generation_task_definitions.additional_params
            ?.api_endpoint;

        // 获取提供商类型
        const provider = getTaskProvider(taskApiEndpoint);

        // 针对图生视频任务的特殊处理：如果任务ID以kling_开头，认为是302.ai的任务
        if (isI2V && task.external_task_id?.startsWith("kling_")) {
          isOfficialKling = true;
        } else {
          // 文生视频任务的常规判断：已知提供商才认为是有效任务
          isOfficialKling = provider === "official" || provider === "302";
        }

        log("Task details", {
          taskId: task.id,
          externalTaskId: task.external_task_id,
          currentStatus: task.status,
          taskType,
          apiEndpoint: taskApiEndpoint,
          provider,
          isI2V,
          isOfficialKling,
          task_additional_params:
            task.video_generation_task_definitions.additional_params || {},
        });

        // Skip if not an official Kling task
        if (!isOfficialKling) {
          log("Skipping non-official Kling task", { taskId: task.id });
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

            successCountRef.value++;
            results.push({
              taskId: task.id,
              success: true,
              newStatus: "failed",
              reason: "timeout_without_api_call",
            });

            continue;
          }
        }

        // 根据提供商类型及任务类型使用不同的API调用方式
        if (
          provider === "302" ||
          (isI2V && task.external_task_id?.startsWith("kling_"))
        ) {
          // 302.ai 特定的API调用逻辑
          await handle302Task(
            task,
            supabase,
            log,
            results,
            successCountRef,
            failCountRef,
          );
          continue; // 跳过后续的官方API处理逻辑
        }

        // 以下是官方Kling API的处理逻辑
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

            successCountRef.value++;
          } else if (task.status === "queued" && hoursSinceUpdate > 6) {
            // If queued for over 6 hours, assume processing has started
            await supabase
              .from("video_generation_task_statuses")
              .update({
                status: "processing",
                updated_at: new Date().toISOString(),
              })
              .eq("id", task.id);

            successCountRef.value++;
          }

          continue;
        }

        const apiResponse: KlingAPIResponse = await response.json();
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
        let errorMessage: string | null = task.error_message;

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
            errorMessage = foundTask.task_status_msg || "任务处理失败";
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
            failCountRef.value++;
          } else {
            // log("Successfully updated task", {
            //   taskId: task.id,
            //   newStatus,
            //   resultUrl
            // });
            successCountRef.value++;
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
        failCountRef.value++;
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
      updated: successCountRef.value,
      failed: failCountRef.value,
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
