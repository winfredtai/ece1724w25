import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { Database } from "@/types/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch task definitions and their statuses
    const { data: creations, error: creationsError } = await supabase
      .from("video_generation_task_definitions")
      .select(
        `
        *,
        video_generation_task_statuses (
          status,
          result_url,
          thumbnail_url,
          error_message,
          created_at,
          updated_at
        )
      `,
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (creationsError) {
      console.error("Error fetching creations:", creationsError);
      return NextResponse.json(
        { error: "Failed to fetch creations" },
        { status: 500 },
      );
    }

    // Transform the data to match the expected format
    const transformedCreations = creations.map(
      (
        creation: Database["public"]["Tables"]["video_generation_task_definitions"]["Row"] & {
          video_generation_task_statuses: Database["public"]["Tables"]["video_generation_task_statuses"]["Row"][];
        },
      ) => ({
        id: creation.id,
        user_id: creation.user_id,
        task_type: creation.task_type,
        model: creation.model,
        high_quality: creation.high_quality,
        prompt: creation.prompt,
        negative_prompt: creation.negative_prompt,
        cfg: creation.cfg,
        credits: creation.credits,
        created_at: creation.created_at,
        start_img_path: creation.start_img_path,
        additional_params: creation.additional_params,
        status:
          creation.video_generation_task_statuses?.[0]?.status || "pending",
        result_url: creation.video_generation_task_statuses?.[0]?.result_url,
        thumbnail_url:
          creation.video_generation_task_statuses?.[0]?.thumbnail_url,
        error_message:
          creation.video_generation_task_statuses?.[0]?.error_message,
      }),
    );

    return NextResponse.json({ creations: transformedCreations });
  } catch (error) {
    console.error("Error in fetch-creation route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
