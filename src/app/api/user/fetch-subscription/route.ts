import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch user subscription
    const { data: subscription, error: subscriptionError } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (subscriptionError) {
      console.error("Error fetching subscription:", subscriptionError);
      return NextResponse.json(
        { error: "Failed to fetch subscription" },
        { status: 500 }
      );
    }

    return NextResponse.json(subscription);
  } catch (error) {
    console.error("Error in fetch-subscription route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 