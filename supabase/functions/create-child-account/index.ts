import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "npm:zod@3.25.76";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BodySchema = z.object({
  email: z.string().trim().email().max(254),
  display_name: z.string().trim().min(1).max(100),
  child_type: z.enum(["family", "tenant"]),
  phone: z.string().trim().max(20).optional().nullable(),
});

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const businessError = (message: string) => json({ success: false, error: message });

const normalizeEmail = (email: string) => email.trim().toLowerCase();

type AuthUser = {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
};

const findAuthUserByEmail = async (
  supabaseUrl: string,
  serviceRoleKey: string,
  email: string,
): Promise<{ user: AuthUser | null; error: string | null }> => {
  const exactEmail = normalizeEmail(email);
  const pickExact = (users: AuthUser[] = []) => users.find((user) => normalizeEmail(user.email ?? "") === exactEmail) ?? null;

  const fetchUsersPage = async (page: number, withFilter: boolean) => {
    const filter = withFilter ? `&filter=${encodeURIComponent(exactEmail)}` : "";
    const response = await fetch(`${supabaseUrl}/auth/v1/admin/users?page=${page}&per_page=1000${filter}`, {
      headers: { Authorization: `Bearer ${serviceRoleKey}`, apikey: serviceRoleKey },
    });
    if (!response.ok) return { users: [] as AuthUser[], error: await response.text() };
    const payload = await response.json();
    return { users: (payload.users ?? []) as AuthUser[], error: null };
  };

  const filteredPage = await fetchUsersPage(1, true);
  if (filteredPage.error) return { user: null, error: filteredPage.error };
  const filteredMatch = pickExact(filteredPage.users);
  if (filteredMatch) return { user: filteredMatch, error: null };

  for (let page = 1; page <= 100; page += 1) {
    const pageResult = await fetchUsersPage(page, false);
    if (pageResult.error) return { user: null, error: pageResult.error };
    const match = pickExact(pageResult.users);
    if (match) return { user: match, error: null };
    if (pageResult.users.length < 1000) break;
  }

  return { user: null, error: listError?.message ?? null };
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
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    const callerId = claimsData?.claims?.sub as string | undefined;
    if (claimsError || !callerId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const caller = { id: callerId } as { id: string };

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: isResident } = await adminClient.rpc("has_role", { _user_id: caller.id, _role: "resident" });
    if (!isResident) {
      return new Response(JSON.stringify({ error: "Resident access only" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: callerProfile } = await adminClient
      .from("profiles")
      .select("parent_user_id, display_name")
      .eq("user_id", caller.id)
      .maybeSingle();

    if (!callerProfile || callerProfile.parent_user_id !== null) {
      return new Response(JSON.stringify({ error: "Only primary residents can add child accounts" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Invalid input" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const { display_name, child_type, phone } = parsed.data;
    const email = normalizeEmail(parsed.data.email);

    const tempPassword = `Triumph${Date.now().toString(36)}!`;
    const createChildProfile = async (newUserId: string, password: string | null) => {
      // Pick parent's primary flat to mirror on profile
      const { data: primaryFlat } = await adminClient
        .from("resident_flats")
        .select("wing, flat_number")
        .eq("user_id", caller.id)
        .order("is_primary", { ascending: false })
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      await adminClient.from("user_roles").upsert({ user_id: newUserId, role: "resident" }, { onConflict: "user_id,role" });

      // handle_new_user trigger creates a base profile; update it with relationship + flat
      const profilePayload = {
        user_id: newUserId,
        display_name,
        phone: phone?.trim() || null,
        parent_user_id: caller.id,
        child_type,
        wing: primaryFlat?.wing ?? null,
        flat_number: primaryFlat?.flat_number ?? null,
      };

      const { data: existingProfile } = await adminClient
        .from("profiles").select("id, parent_user_id").eq("user_id", newUserId).maybeSingle();

      if (existingProfile?.parent_user_id && existingProfile.parent_user_id !== caller.id) {
        return businessError("This email is already linked to another primary resident");
      }

      const profileQuery = existingProfile
        ? adminClient.from("profiles").update(profilePayload).eq("user_id", newUserId)
        : adminClient.from("profiles").insert(profilePayload);

      const { error: profileError } = await profileQuery;
      if (profileError) return json({ error: profileError.message }, 400);

      return json({ success: true, user_id: newUserId, email, temp_password: password });
    };

    const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { display_name },
    });
    if (createErr || !created.user) {
      const msg = createErr?.message ?? "Could not create user";
      if (/already|exists|registered|in use/i.test(msg)) {
        const { user: existingUser, error: lookupError } = await findAuthUserByEmail(adminClient, supabaseUrl, serviceRoleKey, email);
        if (lookupError) return businessError(lookupError);
        if (!existingUser) return businessError("This email already exists, but the account could not be recovered. Please contact support.");

        const { data: existingProfile } = await adminClient
          .from("profiles")
          .select("parent_user_id, child_type, display_name, wing, flat_number")
          .eq("user_id", existingUser.id)
          .maybeSingle();

        const [{ data: existingRoles }, { data: existingFlat }] = await Promise.all([
          adminClient.from("user_roles").select("role").eq("user_id", existingUser.id),
          adminClient.from("resident_flats").select("id").eq("user_id", existingUser.id).limit(1).maybeSingle(),
        ]);
        const roles = (existingRoles ?? []).map((row) => row.role as string);
        const hasBlockingRole = roles.some((role) => role !== "resident");
        const metadataName = typeof existingUser.user_metadata?.display_name === "string" ? existingUser.user_metadata.display_name : "";
        const isMatchingUnclaimedAccount = [existingProfile?.display_name, metadataName]
          .some((name) => normalizeEmail(name ?? "") === normalizeEmail(display_name));
        const isUnclaimedProfile = !existingProfile?.parent_user_id && !existingProfile?.child_type && !existingFlat;

        if (isUnclaimedProfile && !hasBlockingRole && (isMatchingUnclaimedAccount || !metadataName)) {
          const { error: updateErr } = await adminClient.auth.admin.updateUserById(existingUser.id, {
            password: tempPassword,
            email_confirm: true,
            user_metadata: { display_name },
          });
          if (updateErr) return json({ error: updateErr.message }, 400);
          return createChildProfile(existingUser.id, tempPassword);
        }
        if (existingProfile.parent_user_id === caller.id) {
          const { error: updateErr } = await adminClient.auth.admin.updateUserById(existingUser.id, {
            password: tempPassword,
            email_confirm: true,
            user_metadata: { display_name },
          });
          if (updateErr) return json({ error: updateErr.message }, 400);
          return createChildProfile(existingUser.id, tempPassword);
        }
        if (existingProfile?.parent_user_id) return businessError("This email is already linked to another primary resident");

        return businessError("This email already belongs to a primary resident or staff account");
      }
      return json({ error: msg }, 400);
    }

    return createChildProfile(created.user.id, tempPassword);
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});