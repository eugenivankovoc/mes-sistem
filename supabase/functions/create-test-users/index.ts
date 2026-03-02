import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the caller is an administrator
    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );
    const { data: { user: caller }, error: authError } = await anonClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify caller has administrator role
    const { data: hasAdmin } = await adminClient.rpc("has_role", {
      _user_id: caller.id,
      _role: "administrator",
    });
    if (!hasAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden: admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch workstations to map names to IDs
    const { data: workstations } = await adminClient
      .from("workstations")
      .select("id, name");

    const wsMap = new Map<string, string>();
    for (const ws of workstations || []) {
      wsMap.set(ws.name, ws.id);
    }

    const testUsers = [
      { email: "planer@test.com", password: "Test1234", full_name: "Ana Planer", role: "planner", workstation: null },
      { email: "rezanje@test.com", password: "Test1234", full_name: "Ivan Rezanje", role: "operator", workstation: "Rezanje" },
      { email: "kantiranje@test.com", password: "Test1234", full_name: "Marko Kantiranje", role: "operator", workstation: "Kantovanje" },
      { email: "cnc@test.com", password: "Test1234", full_name: "Pero CNC", role: "operator", workstation: "CNC obrada" },
      { email: "kontrola@test.com", password: "Test1234", full_name: "Maja Kontrola", role: "operator", workstation: "Kontrola kvalitete" },
      { email: "skladiste@test.com", password: "Test1234", full_name: "Luka Skladište", role: "operator", workstation: "Sortiranje" },
    ];

    const results: { index: number; email: string; success: boolean; error?: string }[] = [];

    for (let i = 0; i < testUsers.length; i++) {
      const tu = testUsers[i];
      try {
        // Create auth user
        const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
          email: tu.email,
          password: tu.password,
          email_confirm: true,
          user_metadata: { full_name: tu.full_name },
        });

        if (createErr) {
          results.push({ index: i, email: tu.email, success: false, error: createErr.message });
          continue;
        }

        const userId = created.user.id;

        // Update profile
        const workstationId = tu.workstation ? wsMap.get(tu.workstation) || null : null;
        await adminClient
          .from("profiles")
          .update({ full_name: tu.full_name, workstation_id: workstationId })
          .eq("user_id", userId);

        // Assign role
        await adminClient
          .from("user_roles")
          .insert({ user_id: userId, role: tu.role });

        results.push({ index: i, email: tu.email, success: true });
      } catch (e) {
        results.push({ index: i, email: tu.email, success: false, error: String(e) });
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
