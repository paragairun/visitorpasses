import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "npm:zod@3.25.76";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BodySchema = z.object({
  request_id: z.string().uuid(),
  action: z.enum(["approve", "reject"]),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify caller is admin
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await userClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: isAdmin } = await adminClient.rpc("has_role", {
      _user_id: caller.id,
      _role: "admin",
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsedBody = BodySchema.safeParse(await req.json());

    if (!parsedBody.success) {
      return new Response(JSON.stringify({ error: "Invalid request" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { request_id, action } = parsedBody.data;

    // Get the registration request
    const { data: regRequest, error: fetchErr } = await adminClient
      .from("registration_requests")
      .select("*")
      .eq("id", request_id)
      .single();

    if (fetchErr || !regRequest) {
      return new Response(JSON.stringify({ error: "Request not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (regRequest.status !== "pending") {
      return new Response(JSON.stringify({ error: "Already processed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "reject") {
      await adminClient
        .from("registration_requests")
        .update({ status: "rejected", reviewed_by: caller.id, reviewed_at: new Date().toISOString() })
        .eq("id", request_id);

      return new Response(JSON.stringify({ success: true, action: "rejected" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Approve: create user with a temp password, assign role
    const tempPassword = `Triumph${Date.now().toString(36)}!`;

    const { data: newUser, error: createErr } = await adminClient.auth.admin.createUser({
      email: regRequest.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { display_name: regRequest.display_name },
    });

    if (createErr) {
      return new Response(JSON.stringify({ error: createErr.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: roleError } = await adminClient.from("user_roles").insert({
      user_id: newUser.user.id,
      role: regRequest.requested_role,
    });

    if (roleError) {
      return new Response(JSON.stringify({ error: roleError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: existingProfile } = await adminClient
      .from("profiles")
      .select("id")
      .eq("user_id", newUser.user.id)
      .maybeSingle();

    const profilePayload = {
      user_id: newUser.user.id,
      display_name: regRequest.display_name,
      flat_number: regRequest.requested_role === "resident" ? regRequest.flat_number : null,
      wing: regRequest.requested_role === "resident" ? regRequest.wing : null,
    };

    const profileQuery = existingProfile
      ? adminClient.from("profiles").update(profilePayload).eq("user_id", newUser.user.id)
      : adminClient.from("profiles").insert(profilePayload);

    const { error: profileError } = await profileQuery;

    if (profileError) {
      return new Response(JSON.stringify({ error: profileError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark request as approved
    await adminClient
      .from("registration_requests")
      .update({ status: "approved", reviewed_by: caller.id, reviewed_at: new Date().toISOString() })
      .eq("id", request_id);

    return new Response(
      JSON.stringify({
        success: true,
        action: "approved",
        temp_password: tempPassword,
        email: regRequest.email,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
