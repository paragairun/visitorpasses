import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "npm:zod@3.25.76";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RequestSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("list"),
  }),
  z.object({
    action: z.literal("create"),
    visitor_name: z.string().trim().min(1).max(100),
    phone: z.string().trim().min(6).max(20),
    vehicle_number: z.string().trim().min(3).max(30),
    purpose: z.string().trim().max(100).nullable().optional(),
  }),
]);

const buildFlatLabel = (wing: string, flatNumber: string) => `${wing}-${flatNumber}`;

const createGuestPassPayload = (
  request: {
    id: string;
    visitor_name: string;
    phone: string;
    vehicle_number: string;
    purpose: string | null;
  },
  resident: {
    owner_name: string;
    wing: string;
    flat_number: string;
  },
) => ({
  type: "guest_pass",
  request_id: request.id,
  visitor_name: request.visitor_name,
  phone: request.phone,
  vehicle_number: request.vehicle_number,
  purpose: request.purpose,
  flat_number: resident.flat_number,
  wing: resident.wing,
  owner_name: resident.owner_name,
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsedBody = RequestSchema.safeParse(await req.json());
    if (!parsedBody.success) {
      return new Response(JSON.stringify({ error: "Invalid guest pass request" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const publishableKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, publishableKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
    } = await userClient.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: isResident } = await adminClient.rpc("has_role", {
      _user_id: user.id,
      _role: "resident",
    });

    if (!isResident) {
      return new Response(JSON.stringify({ error: "Resident access only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .select("display_name, wing, flat_number")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileError || !profile?.wing || !profile?.flat_number) {
      return new Response(JSON.stringify({ error: "Resident profile is missing wing or flat details" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resident = {
      owner_name: profile.display_name?.trim() || user.email?.split("@")[0] || "Resident",
      wing: profile.wing.trim().toUpperCase(),
      flat_number: profile.flat_number.trim().toUpperCase(),
    };
    const flatLabel = buildFlatLabel(resident.wing, resident.flat_number);

    if (parsedBody.data.action === "list") {
      const [passesResult, logsResult] = await Promise.all([
        adminClient
          .from("visitor_requests")
          .select("id, visitor_name, phone, vehicle_number, purpose, status, created_at")
          .eq("flat_number", flatLabel)
          .in("status", ["guest_pass", "entered"])
          .order("created_at", { ascending: false })
          .limit(5),
        adminClient
          .from("entry_logs")
          .select("id, vehicle_number, owner_name, entry_type, entry_time, exit_time")
          .eq("flat_number", resident.flat_number)
          .eq("wing", resident.wing)
          .order("entry_time", { ascending: false })
          .limit(10),
      ]);

      if (passesResult.error) {
        return new Response(JSON.stringify({ error: passesResult.error.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(
        JSON.stringify({
          resident: { ...resident, flat_label: flatLabel },
          passes: (passesResult.data ?? []).map((pass) => ({
            ...pass,
            qr_payload: JSON.stringify(createGuestPassPayload(pass, resident)),
          })),
          visit_logs: logsResult.data ?? [],
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { visitor_name, phone, vehicle_number, purpose } = parsedBody.data;

    const { data: pass, error } = await adminClient
      .from("visitor_requests")
      .insert({
        visitor_name,
        phone,
        vehicle_number: vehicle_number.toUpperCase(),
        purpose: purpose || null,
        flat_number: flatLabel,
        status: "guest_pass",
      })
      .select("id, visitor_name, phone, vehicle_number, purpose, status, created_at")
      .single();

    if (error || !pass) {
      return new Response(JSON.stringify({ error: error?.message ?? "Could not create guest pass" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        resident: { ...resident, flat_label: flatLabel },
        pass: {
          ...pass,
          qr_payload: JSON.stringify(createGuestPassPayload(pass, resident)),
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});