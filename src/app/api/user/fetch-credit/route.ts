import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    console.log("Auth check:", {
      currentUserId: user?.id,
      expectedUserId: "917df06a-071f-41e4-88b0-e352912430da",
      isMatch: user?.id === "917df06a-071f-41e4-88b0-e352912430da",
    });

    if (userError || !user) {
      console.error("User error:", userError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Try a raw SQL query to bypass RLS
    const { data: rawData, error: rawError } = await supabase
      .from("user_credits")
      .select("*")
      .eq("user_id", user.id);

    console.log("Raw query result:", {
      data: rawData,
      error: rawError,
    });

    if (rawError) {
      console.error("Raw query error:", rawError);
      return NextResponse.json(
        { error: "Failed to fetch credits" },
        { status: 500 },
      );
    }

    if (!rawData || rawData.length === 0) {
      console.log("No credits found for user:", user.id);
      // Try another query approach
      const { data: directData, error: directError } = await supabase.rpc(
        "get_user_credits",
        {
          user_id_param: user.id,
        },
      );

      console.log("Direct query result:", {
        data: directData,
        error: directError,
      });

      if (directData) {
        return NextResponse.json(directData);
      }

      return NextResponse.json({
        user_id: user.id,
        credits_balance: 0,
        total_credits_purchased: 0,
        total_credits_used: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    const credits = rawData[0];
    console.log("Found credits:", credits);
    return NextResponse.json(credits);
  } catch (error) {
    console.error("Error in fetch-credit route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
