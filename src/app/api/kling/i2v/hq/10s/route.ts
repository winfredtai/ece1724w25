import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { AuthError, PostgrestError } from "@supabase/supabase-js";

const API_KEY = process.env.API_302_KEY;
const API_BASE_URL = process.env.API_302_BASE_URL || "https://api.302.ai";
const API_ENDPOINT = API_BASE_URL + "/klingai/m2v_16_img2video_hq_10s";
const CREDITS_REQUIRED = 6; // 图生视频高清质量10秒所需积分

// Define a type for loggable data
type LoggableData =
  | {
      [key: string]:
        | string
        | number
        | boolean
        | null
        | undefined
        | LoggableData
        | Array<LoggableData>;
    }
  | AuthError
  | PostgrestError
  | null;

export async function POST(request: Request) {
  const log = (message: string, data?: LoggableData | unknown) => {
    const timestamp = new Date().toISOString();
    console.log(
      `[${timestamp}][I2V-HQ-10S] ${message}`,
      data ? JSON.stringify(data, null, 2) : "",
    );
  };

  try {
    const supabase = await createClient();
    log("Supabase client created");

    // 1. 验证用户身份
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) {
      log("Authentication error", userError);
      return NextResponse.json(
        { error: "认证错误: " + userError.message },
        { status: 401 },
      );
    }
    if (!user) {
      log("No user found");
      return NextResponse.json(
        { error: "未登录或登录已过期" },
        { status: 401 },
      );
    }
    log("User authenticated", { userId: user.id, email: user.email });

    // 2. 检查用户积分
    const { data: credits, error: creditsError } = await supabase
      .from("user_credits")
      .select("credits_balance")
      .eq("user_id", user.id)
      .maybeSingle();

    if (creditsError) {
      log("Error fetching credits", creditsError);
      return NextResponse.json(
        { error: "获取用户积分失败: " + creditsError.message },
        { status: 500 },
      );
    }

    if (!credits || credits.credits_balance < CREDITS_REQUIRED) {
      log("Insufficient credits", {
        required: CREDITS_REQUIRED,
        available: credits?.credits_balance,
      });
      return NextResponse.json({ error: "积分不足" }, { status: 400 });
    }
    log("User credits verified", {
      balance: credits.credits_balance,
      required: CREDITS_REQUIRED,
    });

    // 3. 解析请求数据
    const formData = await request.formData();
    const inputImage = formData.get("input_image") as File;
    const prompt = formData.get("prompt") as string;
    const negativePrompt = formData.get("negative_prompt") as string;
    const cfg = formData.get("cfg") as string;

    if (!inputImage || !prompt) {
      log("Missing required parameters", {
        hasImage: !!inputImage,
        hasPrompt: !!prompt,
      });
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
    }

    // 4. 创建任务记录
    log("Creating task definition", {
      user_id: user.id,
      task_type: "i2v",
      model: "kling",
      high_quality: true,
      prompt: prompt,
      cfg: cfg || "0.3",
    });

    const { data: taskDef, error: taskDefError } = await supabase
      .from("video_generation_task_definitions")
      .insert({
        user_id: user.id,
        task_type: "i2v",
        model: "kling",
        high_quality: true,
        prompt: prompt,
        negative_prompt: negativePrompt || "",
        cfg: cfg ? parseFloat(cfg) : 0.3,
        credits: CREDITS_REQUIRED,
        start_img_path: "pending", // 临时路径，后续更新
        additional_params: {
          duration: "10s",
          api_endpoint: API_ENDPOINT,
        },
      })
      .select()
      .single();

    if (taskDefError) {
      log("Error creating task definition", taskDefError);
      return NextResponse.json(
        {
          error: "创建任务记录失败: " + taskDefError.message,
          details: taskDefError,
        },
        { status: 500 },
      );
    }
    if (!taskDef) {
      log("No task definition created");
      return NextResponse.json(
        { error: "创建任务记录失败: 未返回任务ID" },
        { status: 500 },
      );
    }
    log("Task definition created", { taskId: taskDef.id });

    // 5. 准备调用外部 API
    const apiFormData = new FormData();
    apiFormData.append("input_image", inputImage);
    apiFormData.append("prompt", prompt);
    if (negativePrompt) apiFormData.append("negative_prompt", negativePrompt);
    apiFormData.append("cfg", cfg || "0.3");

    log("Calling external API", {
      url: API_ENDPOINT,
      hasApiKey: !!API_KEY,
    });

    // 6. 调用 302.ai API
    const apiResponse = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
      },
      body: apiFormData,
    });

    if (!apiResponse.ok) {
      const apiError = await apiResponse.json();
      log("API Error Response", {
        status: apiResponse.status,
        statusText: apiResponse.statusText,
        error: apiError,
      });
      throw new Error(apiError.message || "调用视频生成服务失败");
    }

    const apiResult = await apiResponse.json();
    log("API Success Response", apiResult);

    // 从返回数据中提取 task id
    const externalTaskId = apiResult.data?.task?.id;
    if (!externalTaskId) {
      log("No task ID in API response", apiResult);
      throw new Error("未能获取任务ID");
    }
    log("Extracted external task ID", { externalTaskId });

    // 7. 创建任务状态记录
    log("Creating task status", {
      task_id: taskDef.id,
      external_task_id: externalTaskId,
    });

    // 尝试插入新记录，不带 select
    const { error: insertError } = await supabase
      .from("video_generation_task_statuses")
      .insert({
        task_id: taskDef.id,
        external_task_id: externalTaskId,
        status: "pending",
      });

    if (insertError) {
      log("Error creating task status", {
        error: insertError,
        errorCode: insertError.code,
        errorMessage: insertError.message,
        errorDetails: insertError.details,
        hint: insertError.hint,
        taskId: taskDef.id,
      });

      // 如果是超时错误，等待一小段时间后再查询
      if (insertError.code === "57014") {
        // 等待 1 秒
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // 检查记录是否已创建
      const { data: statusCheck, error: checkError } = await supabase
        .from("video_generation_task_statuses")
        .select("*")
        .eq("task_id", taskDef.id)
        .maybeSingle();

      if (!checkError && statusCheck) {
        log("Found status record after insert attempt", statusCheck);
        return NextResponse.json({
          message: "任务创建成功",
          taskId: taskDef.id,
          statusId: statusCheck.id,
          status: statusCheck.status,
        });
      }

      // 如果仍然失败，返回错误
      return NextResponse.json(
        {
          error: "创建任务状态记录失败: " + insertError.message,
          details: {
            error: insertError,
            taskId: taskDef.id,
            externalTaskId: externalTaskId,
          },
        },
        { status: 500 },
      );
    }

    // 插入成功后查询记录
    const { data: insertedStatus, error: queryError } = await supabase
      .from("video_generation_task_statuses")
      .select("*")
      .eq("task_id", taskDef.id)
      .maybeSingle();

    if (queryError || !insertedStatus) {
      log("Error querying inserted status", queryError);
      // 即使查询失败也返回成功，因为插入已经成功
      return NextResponse.json({
        message: "任务创建成功",
        taskId: taskDef.id,
        status: "pending",
      });
    }

    log("Task status created and verified", insertedStatus);

    // 8. 扣除用户积分
    const { error: creditError } = await supabase.rpc("use_credits", {
      task_id: taskDef.id,
      amount: CREDITS_REQUIRED,
    });

    if (creditError) {
      log("Error deducting credits", creditError);
      // 不中断流程，继续返回成功
    } else {
      log("Credits deducted successfully", { amount: CREDITS_REQUIRED });
    }

    // 9. 返回成功响应
    return NextResponse.json({
      message: "视频生成任务创建成功",
      taskId: taskDef.id,
      statusId: insertedStatus.id,
      status: "pending",
    });
  } catch (error) {
    log("Unexpected error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "服务器内部错误，请稍后重试",
      },
      { status: 500 },
    );
  }
}
