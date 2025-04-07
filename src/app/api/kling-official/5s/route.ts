import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const BASE_URL = process.env.KLING_BASE_URL;
const API_ACCESS_KEY_ID = process.env.KLING_ACCESS_KEY_ID;
const ACCESS_KEY_SECRET = process.env.KLING_ACCESS_KEY_SECRET;
const CREDITS_REQUIRED = 1; // Standard 5s video costs 1 credit
const API_URL = `${BASE_URL}/v1/videos/text2video`;

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

const encode_jwt_token = (): string => {
  if (!API_ACCESS_KEY_ID || !ACCESS_KEY_SECRET) {
    throw new Error("Missing Kling API credentials");
  }
  return generateJwtToken(API_ACCESS_KEY_ID, ACCESS_KEY_SECRET);
};

export async function POST(request: Request) {
  console.log("Received request for 5s standard video generation");

  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    console.log("Request body:", body);

    const requestBody = {
      prompt: body.prompt,
      negative_prompt: body.negative_prompt || "",
      cfg_scale: body.cfg || 0.3,
      camera_control: {
        type: body.camera_type || "simple",
        config: {
          horizontal: body.camera_value || 1,
        },
        aspect_ratio: body.aspect_ratio || "1:1",
      },
    };

    // Create task definition record
    const { data: taskDef, error: taskDefError } = await supabase
      .from("video_generation_task_definitions")
      .insert({
        user_id: user.id,
        task_type: "video",
        model: "kling",
        high_quality: false,
        prompt: body.prompt,
        negative_prompt: body.negative_prompt || "",
        aspect_ratio: body.aspect_ratio || "1:1",
        cfg: body.cfg || 0.3,
        credits: CREDITS_REQUIRED,
        additional_params: {
          duration: "5s",
          api_endpoint: API_URL,
        },
      })
      .select()
      .single();

    if (taskDefError) {
      console.error("Error creating task definition:", {
        error: taskDefError,
        code: taskDefError.code,
        message: taskDefError.message,
        details: taskDefError.details,
        hint: taskDefError.hint,
      });
      return NextResponse.json(
        { error: taskDefError.message || "Failed to create task record" },
        { status: 500 },
      );
    }

    console.log("Created task definition:", taskDef);

    console.log("Sending request to Kling API:", {
      url: API_URL,
      body: requestBody,
    });

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${encode_jwt_token()}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Kling API error:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      throw new Error(
        `API request failed with status ${response.status}: ${errorText}`,
      );
    }

    const data = await response.json();
    console.log("Kling API response:", JSON.stringify(data, null, 2));

    // Create task status record
    const externalTaskId = data.data?.task_id;
    console.log("Attempting to create task status with:", {
      task_id: taskDef.id,
      external_task_id: externalTaskId,
      response_data: data,
    });

    if (!externalTaskId) {
      console.error("No external task ID found in response:", data);
    }

    const { error: statusError } = await supabase
      .from("video_generation_task_statuses")
      .insert({
        task_id: taskDef.id,
        external_task_id: externalTaskId,
        status: "processing",
      })
      .select()
      .single();

    if (statusError) {
      console.error("Error creating task status:", statusError);
      // 如果是超时错误，尝试再次查询确认是否已创建
      if (statusError.code === "57014") {
        const { data: existingStatus, error: queryError } = await supabase
          .from("video_generation_task_statuses")
          .select("*")
          .eq("task_id", taskDef.id)
          .single();

        if (!queryError && existingStatus) {
          console.log(
            "Found existing task status after timeout:",
            existingStatus,
          );
          return NextResponse.json({
            ...data,
            taskId: taskDef.id,
            statusId: existingStatus.id,
          });
        }
      }
      // 如果仍然失败，继续处理但记录错误
      console.error("Failed to verify task status creation:", statusError);
    } else {
      console.log("Successfully created task status record");
    }

    return NextResponse.json({
      ...data,
      taskId: taskDef.id,
    });
  } catch (error) {
    console.error("Error in video generation:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to generate video",
      },
      { status: 500 },
    );
  }
}
