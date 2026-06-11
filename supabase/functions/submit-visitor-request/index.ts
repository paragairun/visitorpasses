import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "npm:zod@3.25.76";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BodySchema = z.object({
  visitor_name: z.string().trim().min(1).max(100),
  phone: z.string().trim().min(6).max(20),
  vehicle_number: z.string().trim().min(3).max(30),
  purpose: z.string().trim().max(100).nullable().optional(),
  flat_number: z.string().trim().min(1).max(20),
  society_id: z.string().uuid(),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const parsedBody = BodySchema.safeParse(await req.json());

    if (!parsedBody.success) {
      return new Response(JSON.stringify({ error: "Invalid visitor request payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { visitor_name, phone, vehicle_number, purpose, flat_number, society_id } = parsedBody.data;

    const { error } = await adminClient.from("visitor_requests").insert({
      visitor_name,
      phone,
      vehicle_number: vehicle_number.toUpperCase(),
      purpose: purpose || null,
      flat_number: flat_number.toUpperCase(),
      status: "pending",
      society_id,
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});