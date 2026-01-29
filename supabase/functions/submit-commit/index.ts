import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-api-key, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface CommitRequest {
  commit_id: string;
  message: string;
  developer_name: string;
  developer_email?: string;
  team_name: string;
  type?: string;
  evaluation: {
    total: number;
    complexity: number;
    volume: number;
    thinking: number;
    others: number;
  };
  comment?: string;
  lines_added?: number;
  lines_deleted?: number;
  work_hours?: number;
  ai_driven_minutes?: number;
  productivity?: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify API Key
    const apiKey = req.headers.get("x-api-key");
    const expectedApiKey = Deno.env.get("API_KEY");

    if (!apiKey || apiKey !== expectedApiKey) {
      return new Response(
        JSON.stringify({ error: "Invalid API key" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const data: CommitRequest = await req.json();

    // Validate required fields
    if (!data.commit_id || !data.message || !data.developer_name || !data.team_name) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find or create team
    let teamId: string;
    const { data: existingTeam } = await supabase
      .from("teams")
      .select("id")
      .eq("name", data.team_name)
      .single();

    if (existingTeam) {
      teamId = existingTeam.id;
    } else {
      const { data: newTeam, error: teamError } = await supabase
        .from("teams")
        .insert({ name: data.team_name })
        .select("id")
        .single();

      if (teamError) throw teamError;
      teamId = newTeam.id;
    }

    // Find or create developer
    let developerId: string;
    const developerQuery = data.developer_email
      ? supabase.from("developers").select("id").eq("email", data.developer_email).single()
      : supabase.from("developers").select("id").eq("name", data.developer_name).eq("team_id", teamId).single();

    const { data: existingDeveloper } = await developerQuery;

    if (existingDeveloper) {
      developerId = existingDeveloper.id;
    } else {
      const { data: newDeveloper, error: devError } = await supabase
        .from("developers")
        .insert({
          name: data.developer_name,
          email: data.developer_email || null,
          team_id: teamId,
        })
        .select("id")
        .single();

      if (devError) throw devError;
      developerId = newDeveloper.id;
    }

    // Upsert developer-team relationship (many-to-many)
    const { error: dtError } = await supabase
      .from("developer_teams")
      .upsert(
        { developer_id: developerId, team_id: teamId },
        { onConflict: "developer_id,team_id" }
      );

    if (dtError) throw dtError;

    // Insert commit
    const { error: commitError } = await supabase.from("commits").insert({
      commit_id: data.commit_id,
      message: data.message,
      developer_id: developerId,
      team_id: teamId,
      type: data.type || 'develop',
      evaluation_total: data.evaluation.total,
      evaluation_complexity: data.evaluation.complexity,
      evaluation_volume: data.evaluation.volume,
      evaluation_thinking: data.evaluation.thinking,
      evaluation_others: data.evaluation.others,
      comment: data.comment || null,
      lines_added: data.lines_added || 0,
      lines_deleted: data.lines_deleted || 0,
      work_hours: data.work_hours || null,
      ai_driven_minutes: data.ai_driven_minutes || null,
      productivity: data.productivity || null,
    });

    if (commitError) throw commitError;

    return new Response(
      JSON.stringify({ success: true, message: "Commit submitted successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
