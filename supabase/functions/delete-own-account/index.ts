import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

/**
 * Lets a logged-in user delete their OWN account and its resident-specific
 * data. Separate from delete-user (which is admin-only and explicitly
 * forbids self-deletion) since the trust model here is different: no admin
 * role is required, but the caller can only ever act on themselves.
 *
 * Mirrors delete-user's careful approach: log references are nulled rather
 * than deleted (preserves the society's audit trail), and a user who
 * belongs to multiple societies only loses THIS society's membership, not
 * their entire account.
 */
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

    const { data: callerProfile } = await adminClient
      .from("profiles")
      .select("society_id, parent_user_id")
      .eq("user_id", caller.id)
      .maybeSingle();

    const targetSocietyId = callerProfile?.society_id;
    if (!targetSocietyId) return json({ error: "Could not determine society" }, 400);

    // Block deletion if this account is a primary resident with active child
    // (family/tenant) accounts -- deleting them first is the parent's own
    // explicit decision, we don't cascade-delete other people's accounts
    // as a side effect of someone else deleting their own.
    if (!callerProfile.parent_user_id) {
      const { count: childCount } = await adminClient
        .from("profiles")
        .select("user_id", { count: "exact", head: true })
        .eq("parent_user_id", caller.id);

      if ((childCount ?? 0) > 0) {
        return json({ error: "Remove family/tenant accounts linked to your profile before deleting your own account." }, 400);
      }
    }

    // Resident-specific data tied directly to this user
    await adminClient.from("resident_flats").delete().eq("user_id", caller.id);
    await adminClient.from("device_push_tokens").delete().eq("user_id", caller.id);

    // Null out references in historical/audit records rather than deleting
    // them, so the society's records stay intact.
    await adminClient.from("access_logs").update({ logged_by: null }).eq("logged_by", caller.id);
    await adminClient.from("entry_logs").update({ logged_by: null }).eq("logged_by", caller.id);
    await adminClient.from("amenity_bookings").update({ booked_by: null }).eq("booked_by", caller.id);
    await adminClient.from("vehicle_change_requests").update({ requested_by: null }).eq("requested_by", caller.id);

    // Step 1: remove this society's role
    await adminClient
      .from("user_roles")
      .delete()
      .eq("user_id", caller.id)
      .eq("society_id", targetSocietyId);

    // Step 2: check for membership in other societies before deciding
    // whether to fully delete the account or just this society's profile.
    const { data: remainingRoles } = await adminClient
      .from("user_roles")
      .select("society_id")
      .eq("user_id", caller.id);

    const hasOtherSocieties = (remainingRoles ?? []).length > 0;

    if (!hasOtherSocieties) {
      if (callerProfile) {
        // Clean up any registration request tied to this email
        const { data: targetUser } = await adminClient.auth.admin.getUserById(caller.id);
        const targetEmail = targetUser?.user?.email ?? null;
        if (targetEmail) {
          await adminClient.from("registration_requests").update({ reviewed_by: null }).eq("reviewed_by", caller.id);
          await adminClient.from("registration_requests").delete().eq("email", targetEmail);
        }
      }

      await adminClient.from("profiles").delete().eq("user_id", caller.id);
      const { error: delErr } = await adminClient.auth.admin.deleteUser(caller.id);
      if (delErr) return json({ error: delErr.message }, 400);

      return json({ success: true, action: "fully_deleted" });
    } else {
      const nextSocietyId = remainingRoles![0].society_id;
      await adminClient
        .from("profiles")
        .update({ society_id: nextSocietyId, wing: null, flat_number: null })
        .eq("user_id", caller.id);

      return json({ success: true, action: "removed_from_society" });
    }
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});
