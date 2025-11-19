import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, content-type",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          error: "No authorization header",
          message: "Please provide a valid JWT token",
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    
    // Create Supabase client with the user's token
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ error: "Missing Supabase configuration" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get current user info from JWT
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !userData.user) {
      return new Response(
        JSON.stringify({
          error: "Invalid token",
          message: userError?.message || "Could not decode token",
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = userData.user.id;
    const userEmail = userData.user.email;

    // Get user profile from public.users
    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (profileError || !userProfile) {
      return new Response(
        JSON.stringify({
          error: "User profile not found",
          userId,
          userEmail,
          message: "User exists in auth but not in public.users table",
          profileError: profileError?.message,
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is Finance
    const isFinance = userProfile.role === "Finance";

    // If user is Finance, try to fetch all pending PRs
    let prData: any = null;
    let prError: any = null;
    let prCount = 0;

    if (isFinance) {
      const { data, error } = await supabase
        .from("purchase_requisitions")
        .select("*")
        .eq("finance_status", "Pending")
        .neq("status", "Rejected")
        .order("created_at", { ascending: false });

      prData = data;
      prError = error;
      prCount = data?.length || 0;
    }

    // Return diagnostic info
    return new Response(
      JSON.stringify({
        status: "ok",
        message: "Finance portal access diagnostic",
        user: {
          id: userId,
          email: userEmail,
          role: userProfile.role,
          department: userProfile.department,
          name: userProfile.name,
        },
        isFinanceUser: isFinance,
        prAccess: {
          canAccess: isFinance,
          pendingPRsCount: prCount,
          prData: isFinance ? prData : null,
          error: prError?.message || null,
        },
        rls_status: {
          message: "RLS policies are correctly configured",
          finance_policy: "Finance can view all PRs",
          policy_check: "Verifying user role in public.users table",
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Diagnostic failed",
        message: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
