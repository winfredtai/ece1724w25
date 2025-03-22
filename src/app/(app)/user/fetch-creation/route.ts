import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();

  // User is already authenticated by middleware
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // This should never happen due to middleware, but TypeScript needs this check
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 401 });
  }

  try {
    const userId = user.id;

    // 1. Get user's video generation tasks
    const { data: taskDefinitions, error: taskError } = await supabase
      .from("video_generation_task_definitions")
      .select(
        `
        id,
        prompt,
        model,
        task_type,
        start_img_path,
        end_img_path,
        created_at,
        video_generation_task_statuses(
          id,
          status,
          result_url,
          thumbnail_url,
          error_message,
          updated_at
        )
      `,
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (taskError) throw taskError;

    // 2. Get user's favorites
    const { data: favorites, error: favoritesError } = await supabase
      .from("user_favorites")
      .select("task_id")
      .eq("user_id", userId);

    if (favoritesError) throw favoritesError;

    // Create set of favorite task IDs for quick lookup
    const favoriteTaskIds = new Set(favorites?.map((fav) => fav.task_id) || []);

    // 3. Convert data to UI format
    const creations =
      taskDefinitions?.map((task) => {
        // Get latest task status
        const taskStatus = task.video_generation_task_statuses?.[0] || {};
        const statusValue = taskStatus.status || "processing";

        // Determine task type
        const type = task.task_type === "image_generation" ? "image" : "video";

        // Determine title - use first 20 chars of prompt or default title
        const title = task.prompt
          ? task.prompt.length > 20
            ? `${task.prompt.substring(0, 20)}...`
            : task.prompt
          : `${type === "video" ? "video" : "image"} creation`;

        return {
          id: task.id.toString(),
          type,
          title,
          description: task.prompt || "",
          thumbnailUrl:
            taskStatus.thumbnail_url ||
            task.start_img_path ||
            "/images/placeholder.jpg",
          url: taskStatus.result_url || "",
          createdAt: task.created_at,
          status:
            statusValue === "completed"
              ? "completed"
              : statusValue === "failed"
                ? "failed"
                : "processing",
          starred: favoriteTaskIds.has(task.id),
        };
      }) || [];

    return NextResponse.json({ creations });
  } catch (error) {
    console.error("Failed to fetch user creations:", error);
    return NextResponse.json(
      { error: "Failed to fetch user creations" },
      { status: 500 },
    );
  }
}
