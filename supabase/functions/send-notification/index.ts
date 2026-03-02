import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface NotificationPayload {
  action: "order_completed" | "rework_requested";
  order_id: string;
  order_name?: string;
  part_name?: string;
  triggered_by: string; // user_id who triggered
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const payload: NotificationPayload = await req.json();
    const { action, order_id, order_name, part_name, triggered_by } = payload;

    const notifications: Array<{
      user_id: string;
      title: string;
      message: string;
      type: string;
      reference_id: string;
      reference_table: string;
    }> = [];

    if (action === "order_completed") {
      // Fetch order creator
      const { data: order } = await supabase
        .from("orders")
        .select("created_by, order_name, order_number")
        .eq("id", order_id)
        .single();

      if (order?.created_by) {
        const name = order.order_name || order.order_number || order_id;
        notifications.push({
          user_id: order.created_by,
          title: "Nalog završen",
          message: `Nalog ${name} je u potpunosti završen.`,
          type: "order_completed",
          reference_id: order_id,
          reference_table: "orders",
        });
      }
    } else if (action === "rework_requested") {
      // Fetch all admin + planner user IDs
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id")
        .in("role", ["administrator", "planner"]);

      const targetUsers = (roles ?? [])
        .map((r) => r.user_id)
        .filter((uid) => uid !== triggered_by);

      const displayOrder = order_name || order_id;
      const displayPart = part_name || "dio";

      for (const uid of targetUsers) {
        notifications.push({
          user_id: uid,
          title: "Dorada prijavljena",
          message: `Dio ${displayPart} iz naloga ${displayOrder} je prijavljen za doradu.`,
          type: "rework_requested",
          reference_id: order_id,
          reference_table: "orders",
        });
      }
    }

    if (notifications.length > 0) {
      const { error } = await supabase.from("notifications").insert(notifications);
      if (error) throw error;
    }

    return new Response(JSON.stringify({ sent: notifications.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
