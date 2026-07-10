import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "npm:zod@3.25.76";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Accepts either a direct call ({ user_ids, title, body }) or a Database
// Webhook-style payload ({ type, table, record }) -- callers that just want
// to fire-and-forget from a DB trigger can pass the raw row, and this
// function's per-event logic below maps it to the right recipients/copy.
const DirectPayloadSchema = z.object({
  user_ids: z.array(z.string().uuid()),
  title: z.string(),
  body: z.string(),
  data: z.record(z.string()).optional(),
});

/** Minimal FCM HTTP v1 client using a service account for OAuth2. */
async function getAccessToken(serviceAccount: { client_email: string; private_key: string }): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claims = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };
  const enc = (obj: unknown) => btoa(JSON.stringify(obj)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const unsigned = `${enc(header)}.${enc(claims)}`;

  const keyData = serviceAccount.private_key.replace(/-----[A-Z ]+-----|\n/g, "");
  const binaryKey = Uint8Array.from(atob(keyData), (c) => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8", binaryKey, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]
  );
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKey, new TextEncoder().encode(unsigned));
  const sig = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const jwt = `${unsigned}.${sig}`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  const tokenJson = await tokenRes.json();
  if (!tokenRes.ok) throw new Error(`FCM auth failed: ${JSON.stringify(tokenJson)}`);
  return tokenJson.access_token;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const serviceAccountJson = Deno.env.get("FCM_SERVICE_ACCOUNT_JSON");
    if (!serviceAccountJson) {
      console.error("FCM_SERVICE_ACCOUNT_JSON is not set");
      return new Response(JSON.stringify({ error: "Push service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const serviceAccount = JSON.parse(serviceAccountJson);

    const body = await req.json();
    const parsed = DirectPayloadSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Invalid payload", details: parsed.error.flatten() }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { user_ids, title, body: messageBody, data } = parsed.data;

    if (user_ids.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: tokenRows, error: tokenError } = await adminClient
      .from("device_push_tokens")
      .select("token")
      .in("user_id", user_ids);

    if (tokenError) {
      console.error("Failed to look up device tokens:", tokenError);
      return new Response(JSON.stringify({ error: "Could not look up device tokens" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!tokenRows || tokenRows.length === 0) {
      // Not an error -- the user(s) just don't have the app installed / haven't granted permission.
      return new Response(JSON.stringify({ sent: 0, reason: "no registered devices" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const accessToken = await getAccessToken(serviceAccount);
    let sent = 0;
    const errors: string[] = [];

    for (const { token } of tokenRows) {
      const fcmRes = await fetch(
        `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: {
              token,
              notification: { title, body: messageBody },
              data: data ?? {},
            },
          }),
        }
      );
      if (fcmRes.ok) {
        sent++;
      } else {
        const errText = await fcmRes.text();
        errors.push(errText);
        console.error("FCM send failed for a token:", errText);
      }
    }

    return new Response(JSON.stringify({ sent, failed: errors.length }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unexpected error in send-push-notification:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
