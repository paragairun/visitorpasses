import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BOOTSTRAP_TOKEN = "bootstrap-parag-2026";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const json = (b: Record<string, unknown>, s = 200) =>
    new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const { token, email, password } = await req.json();
    if (token !== BOOTSTRAP_TOKEN) return json({ error: "Forbidden" }, 403);
    if (!email || !password) return json({ error: "email and password required" }, 400);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Find or create user
    let userId: string | null = null;
    for (let page = 1; page <= 10; page++) {
      const { data: list } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
      const m = list?.users.find((u) => (u.email ?? "").toLowerCase() === email.toLowerCase());
      if (m) { userId = m.id; break; }
      if (!list || list.users.length < 1000) break;
    }

    if (userId) {
      await admin.auth.admin.updateUserById(userId, { password, email_confirm: true });
    } else {
      const { data: c, error: cErr } = await admin.auth.admin.createUser({
        email, password, email_confirm: true,
        user_metadata: { display_name: "Platform Super Admin" },
      });
      if (cErr || !c.user) return json({ error: cErr?.message ?? "create failed" }, 400);
      userId = c.user.id;
    }

    // Ensure profile exists
    const { data: existing } = await admin.from("profiles").select("id").eq("user_id", userId).maybeSingle();
    if (!existing) {
      await admin.from("profiles").insert({ user_id: userId, display_name: "Platform Super Admin" });
    }

    // Assign super_admin role
    const { error: rErr } = await admin.from("user_roles").upsert(
      { user_id: userId, role: "super_admin" },
      { onConflict: "user_id,role" },
    );
    if (rErr) return json({ error: rErr.message }, 400);

    return json({ success: true, user_id: userId, email });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "unexpected" }, 500);
  }
});
