import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

const API_KEY = process.env.API_302_KEY;
const API_BASE_URL = "https://api.302.ai/klingai/m2v_16_txt2video_hq_5s";
const CREDITS_REQUIRED = 2; // HQ 5s video costs 2 credits

export async function POST(request: Request) {
  console.log("Received request for 5s high-quality video generation");

  if (!API_KEY) {
    console.error("API key not configured");
    return NextResponse.json(
      { error: "API key not configured" },
      { status: 500 },
    );
  }

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
      cfg: body.cfg || 0.3,
      aspect_ratio: body.aspect_ratio || "1:1",
    };

    // Create task definition record
    const { data: taskDef, error: taskDefError } = await supabase
      .from("video_generation_task_definitions")
      .insert({
        user_id: user.id,
        task_type: "video",
        model: "kling",
        high_quality: true,
        prompt: body.prompt,
        negative_prompt: body.negative_prompt || "",
        aspect_ratio: body.aspect_ratio || "1:1",
        cfg: body.cfg || 0.3,
        credits: CREDITS_REQUIRED,
        additional_params: {
          duration: "5s",
          api_endpoint: API_BASE_URL,
        },
      })
      .select()
      .single();

    if (taskDefError) {
      console.error("Error creating task definition:", taskDefError);
      return NextResponse.json(
        { error: "Failed to create task record" },
        { status: 500 },
      );
    }

    console.log("Created task definition:", taskDef);

    console.log("Sending request to 302.ai:", {
      url: API_BASE_URL,
      body: requestBody,
    });

    const response = await fetch(API_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("302.ai API error:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      throw new Error(
        `API request failed with status ${response.status}: ${errorText}`,
      );
    }

    const data = await response.json();
    console.log("302.ai API response:", JSON.stringify(data, null, 2));

    // Create task status record
    const externalTaskId = data.data?.task?.id;
    console.log("Attempting to create task status with:", {
      task_id: taskDef.id,
      external_task_id: externalTaskId,
      response_data: data,
    });

    if (!externalTaskId) {
      console.error("No external task ID found in response:", data);
    }

    const { data: statusData, error: statusError } = await supabase
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
      // Continue with the response even if status creation fails
      // We'll handle this case in monitoring
    } else {
      console.log("Successfully created task status record:", statusData);
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
