import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Verify user authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user subscription
    const { data, error } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    if (data) {
      // Fetch user credits to get usage information
      const { data: creditsData, error: creditsError } = await supabase
        .from("user_credits")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (creditsError && creditsError.code !== "PGRST116") {
        throw creditsError;
      }

      return NextResponse.json({
        ...data,
        creditsTotal: data.credits_per_period,
        creditsUsed: creditsData ? creditsData.total_credits_used : 0,
      });
    } else {
      // Default subscription for users without a subscription record
      return NextResponse.json({
        id: 0,
        user_id: user.id,
        plan_type: "free",
        status: "active",
        start_date: new Date().toISOString(),
        end_date: new Date().toISOString(),
        next_renewal_date: new Date().toISOString(),
        auto_renew: false,
        credits_per_period: 10,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        cancellation_date: null,
        payment_method: null,
        price_paid: null,
        subscription_interval: null,
        creditsTotal: 10,
        creditsUsed: 0,
      });
    }
  } catch (error) {
    console.error("Error fetching user subscription:", error);
    return NextResponse.json(
      { error: "Failed to fetch user subscription" },
      { status: 500 },
    );
  }
}
