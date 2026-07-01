import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const token = authHeader.replace(/^Bearer\s+/i, "");
    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const callerId = claimsData.claims.sub as string;

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: isAdmin } = await adminClient.rpc("has_role", { _user_id: callerId, _role: "admin" });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin only" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const [rolesRes, profilesRes, vehiclesRes, usersRes] = await Promise.all([
      adminClient.from("user_roles").select("user_id, role"),
      adminClient.from("profiles").select("user_id, display_name, wing, flat_number"),
      adminClient.from("vehicles").select("vehicle_number, vehicle_type, wing, flat_number"),
      adminClient.auth.admin.listUsers({ perPage: 1000 }),
    ]);

    if (rolesRes.error || profilesRes.error || vehiclesRes.error || usersRes.error) {
      return new Response(JSON.stringify({ error: "Failed to load data" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const profileMap = new Map((profilesRes.data ?? []).map((p) => [p.user_id, p]));
    const emailMap = new Map((usersRes.data.users ?? []).map((u) => [u.id, u.email ?? null]));

    const rows = (rolesRes.data ?? []).map((r) => {
      const p = profileMap.get(r.user_id);
      const vehicles = (vehiclesRes.data ?? [])
        .filter((v) => p && v.wing === p.wing && v.flat_number === p.flat_number)
        .map((v) => ({ vehicle_number: v.vehicle_number, vehicle_type: v.vehicle_type }));
      return {
        user_id: r.user_id,
        role: r.role,
        display_name: p?.display_name ?? null,
        email: emailMap.get(r.user_id) ?? null,
        wing: p?.wing ?? null,
        flat_number: p?.flat_number ?? null,
        vehicles,
      };
    });

    return new Response(JSON.stringify({ users: rows }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
