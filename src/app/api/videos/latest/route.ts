import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { Database } from "@/types/supabase";
import { PostgrestError } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

type VideoTask =
  Database["public"]["Tables"]["video_generation_task_statuses"]["Row"] & {
    video_generation_task_definitions?: Database["public"]["Tables"]["video_generation_task_definitions"]["Row"];
  };

export async function GET() {
  try {
    const supabase = await createClient();

    // 获取最新的5个已完成的视频任务
    const { data: videoTasks, error } = (await supabase
      .from("video_generation_task_statuses")
      .select(
        `
        id,
        result_url,
        created_at,
        video_generation_task_definitions (
          prompt
        )
      `,
      )
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(8)) as { data: VideoTask[] | null; error: PostgrestError | null };

    if (error) {
      console.error("获取视频失败:", error);
      return NextResponse.json(
        { error: error.message || "获取视频失败" },
        { status: 500 },
      );
    }

    if (!videoTasks) {
      return NextResponse.json([]);
    }

    // 转换数据格式以匹配前端期望的结构
    const formattedVideos = videoTasks.map((task) => ({
      id: task.id.toString(),
      videoUrl: task.result_url,
      created_at: task.created_at,
      title: task.video_generation_task_definitions?.prompt || "未命名视频",
    }));

    return NextResponse.json(formattedVideos);
  } catch (error) {
    console.error("服务器错误:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "服务器错误",
      },
      { status: 500 },
    );
  }
}
