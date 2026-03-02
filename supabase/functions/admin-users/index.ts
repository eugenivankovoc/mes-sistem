import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function verifyAdmin(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) throw { status: 401, message: "Missing auth header" };

  const anonClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!
  );
  const {
    data: { user: caller },
    error,
  } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
  if (error || !caller) throw { status: 401, message: "Unauthorized" };

  const adminClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: isAdmin } = await adminClient.rpc("has_role", {
    _user_id: caller.id,
    _role: "administrator",
  });
  if (!isAdmin) throw { status: 403, message: "Forbidden: admin only" };

  return { caller, adminClient };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { caller, adminClient } = await verifyAdmin(req);
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // ─── LIST USERS ───
    if (req.method === "GET" && action === "list") {
      // Get all profiles
      const { data: profiles, error: pErr } = await adminClient
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: true });
      if (pErr) return json({ error: pErr.message }, 500);

      // Get all roles
      const { data: roles } = await adminClient
        .from("user_roles")
        .select("user_id, role");

      // Get auth users for last_sign_in_at
      const { data: authData } = await adminClient.auth.admin.listUsers({
        perPage: 1000,
      });

      const roleMap = new Map(
        (roles || []).map((r: any) => [r.user_id, r.role])
      );
      const authMap = new Map(
        (authData?.users || []).map((u: any) => [u.id, u.last_sign_in_at])
      );

      const users = (profiles || []).map((p: any) => ({
        ...p,
        role: roleMap.get(p.user_id) || null,
        last_sign_in_at: authMap.get(p.user_id) || null,
      }));

      return json({ users });
    }

    // ─── INVITE USER ───
    if (req.method === "POST" && action === "invite") {
      const { email, full_name, role, workstation_id } = await req.json();

      if (!email || !full_name || !role) {
        return json({ error: "Missing required fields" }, 400);
      }

      const { data: invited, error: invErr } =
        await adminClient.auth.admin.inviteUserByEmail(email, {
          data: { full_name },
        });

      if (invErr) return json({ error: invErr.message }, 400);

      const userId = invited.user.id;

      // Update profile
      await adminClient
        .from("profiles")
        .update({
          full_name,
          workstation_id: role === "operator" ? workstation_id || null : null,
        })
        .eq("user_id", userId);

      // Assign role
      await adminClient.from("user_roles").insert({ user_id: userId, role });

      return json({ success: true, user_id: userId });
    }

    // ─── UPDATE USER ───
    if (req.method === "PATCH" && action === "update") {
      const { user_id, role, workstation_id, is_active, full_name } =
        await req.json();

      if (!user_id) return json({ error: "Missing user_id" }, 400);

      // Prevent self-deactivation
      if (user_id === caller.id && is_active === false) {
        return json(
          { error: "Ne možete deaktivirati vlastiti račun" },
          400
        );
      }

      // Update profile fields
      const profileUpdate: Record<string, any> = {};
      if (typeof is_active === "boolean") profileUpdate.is_active = is_active;
      if (typeof workstation_id !== "undefined")
        profileUpdate.workstation_id = workstation_id || null;
      if (typeof full_name === "string") profileUpdate.full_name = full_name;

      if (Object.keys(profileUpdate).length > 0) {
        const { error: upErr } = await adminClient
          .from("profiles")
          .update(profileUpdate)
          .eq("user_id", user_id);
        if (upErr) return json({ error: upErr.message }, 500);
      }

      // Update role
      if (role) {
        // Upsert: delete old + insert new
        await adminClient
          .from("user_roles")
          .delete()
          .eq("user_id", user_id);
        const { error: rErr } = await adminClient
          .from("user_roles")
          .insert({ user_id, role });
        if (rErr) return json({ error: rErr.message }, 500);
      }

      return json({ success: true });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e: any) {
    const status = e?.status || 500;
    return json({ error: e?.message || String(e) }, status);
  }
});
