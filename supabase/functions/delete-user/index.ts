import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing auth" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user: caller } } = await userClient.auth.getUser();
    if (!caller) return json({ error: "Unauthorized" }, 401);

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: isAdmin } = await adminClient.rpc("has_role", { _user_id: caller.id, _role: "admin" });
    if (!isAdmin) return json({ error: "Admin only" }, 403);

    const { user_id, society_id } = await req.json();
    if (!user_id || typeof user_id !== "string") return json({ error: "Invalid user_id" }, 400);
    if (user_id === caller.id) return json({ error: "Cannot delete yourself" }, 400);

    // Get the caller's society_id to scope the deletion correctly
    const { data: callerProfile } = await adminClient
      .from("profiles")
      .select("society_id")
      .eq("user_id", caller.id)
      .maybeSingle();

    const targetSocietyId = society_id ?? callerProfile?.society_id;
    if (!targetSocietyId) return json({ error: "Could not determine society" }, 400);

    // Step 1: Remove the user's role for this specific society only
    await adminClient
      .from("user_roles")
      .delete()
      .eq("user_id", user_id)
      .eq("society_id", targetSocietyId);

    // Step 2: Remove profile association to this society only
    // Check if user has roles in other societies first
    const { data: remainingRoles } = await adminClient
      .from("user_roles")
      .select("society_id")
      .eq("user_id", user_id);

    const hasOtherSocieties = (remainingRoles ?? []).length > 0;

    if (!hasOtherSocieties) {
      // No remaining society memberships — safe to fully delete
      const { data: targetUser } = await adminClient.auth.admin.getUserById(user_id);
      const targetEmail = targetUser?.user?.email ?? null;

      // Null out log references to preserve history
      await adminClient.from("access_logs").update({ logged_by: null }).eq("logged_by", user_id);
      await adminClient.from("entry_logs").update({ logged_by: null }).eq("logged_by", user_id);

      // Clean up registration requests
      if (targetEmail) {
        await adminClient.from("registration_requests").update({ reviewed_by: null }).eq("reviewed_by", user_id);
        await adminClient.from("registration_requests").delete().eq("email", targetEmail);
      }

      await adminClient.from("profiles").delete().eq("user_id", user_id);
      const { error: delErr } = await adminClient.auth.admin.deleteUser(user_id);
      if (delErr) return json({ error: delErr.message }, 400);

      return json({ success: true, action: "fully_deleted" });
    } else {
      // User still belongs to other societies — only remove their profile for this society
      // Update profile to point to one of their remaining societies
      const nextSocietyId = remainingRoles![0].society_id;
      await adminClient
        .from("profiles")
        .update({ society_id: nextSocietyId })
        .eq("user_id", user_id)
        .eq("society_id", targetSocietyId);

      return json({ success: true, action: "removed_from_society" });
    }
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});
