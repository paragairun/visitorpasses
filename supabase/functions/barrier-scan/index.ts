import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

// Webhook for boom-barrier ANPR/QR controllers.
// Auth: device sends header `x-device-token` matching barrier_devices.device_token.
// Body: { qr?: string, vehicle_number?: string, direction?: 'entry'|'exit' }
// Response: { open: boolean, reason: string }

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const token = req.headers.get("x-device-token");
    if (!token) return json({ open: false, reason: "missing_device_token" }, 401);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: device, error: devErr } = await admin
      .from("barrier_devices")
      .select("*")
      .eq("device_token", token)
      .eq("is_active", true)
      .maybeSingle();
    if (devErr || !device) return json({ open: false, reason: "invalid_device" }, 403);

    await admin.from("barrier_devices").update({ last_seen_at: new Date().toISOString() }).eq("id", device.id);

    const body = await req.json().catch(() => ({}));
    const qr: string | undefined = typeof body.qr === "string" ? body.qr : undefined;
    const vehicleNumber: string | undefined =
      typeof body.vehicle_number === "string" ? body.vehicle_number.trim().toUpperCase() : undefined;
    const direction: string = body.direction === "exit" ? "exit" : "entry";

    const logEvent = async (
      decision: "opened" | "denied",
      reason: string,
      entry_log_id: string | null,
      vn: string | null,
    ) => {
      await admin.from("barrier_events").insert({
        device_id: device.id,
        vehicle_number: vn,
        qr_payload: qr ?? null,
        decision,
        reason,
        entry_log_id,
      });
    };

    // Look up the vehicle by QR first, then plate.
    let vehicle: { vehicle_number: string; wing: string; flat_number: string; owner_name: string } | null = null;
    if (qr) {
      const { data } = await admin.from("vehicles").select("vehicle_number,wing,flat_number,owner_name").eq("qr_code", qr).maybeSingle();
      if (data) vehicle = data as typeof vehicle;
    }
    if (!vehicle && vehicleNumber) {
      const { data } = await admin.from("vehicles").select("vehicle_number,wing,flat_number,owner_name").eq("vehicle_number", vehicleNumber).maybeSingle();
      if (data) vehicle = data as typeof vehicle;
    }

    if (!vehicle) {
      await logEvent("denied", "unknown_vehicle", null, vehicleNumber ?? null);
      return json({ open: false, reason: "unknown_vehicle" });
    }

    if (direction === "exit") {
      const { data: open } = await admin
        .from("entry_logs")
        .select("id")
        .eq("vehicle_number", vehicle.vehicle_number)
        .is("exit_time", null)
        .order("entry_time", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (open?.id) {
        await admin.from("entry_logs").update({ exit_time: new Date().toISOString() }).eq("id", open.id);
      }
      await logEvent("opened", "exit_ok", open?.id ?? null, vehicle.vehicle_number);
      return json({ open: true, reason: "exit_ok" });
    }

    const { data: entry, error: entryErr } = await admin
      .from("entry_logs")
      .insert({
        vehicle_number: vehicle.vehicle_number,
        flat_number: vehicle.flat_number,
        wing: vehicle.wing,
        entry_type: "resident",
        owner_name: vehicle.owner_name,
      })
      .select("id")
      .maybeSingle();
    if (entryErr) {
      await logEvent("denied", `log_error:${entryErr.message}`, null, vehicle.vehicle_number);
      return json({ open: false, reason: "log_error" }, 500);
    }
    await logEvent("opened", "entry_ok", entry?.id ?? null, vehicle.vehicle_number);
    return json({ open: true, reason: "entry_ok" });
  } catch (e) {
    return json({ open: false, reason: `error:${(e as Error).message}` }, 500);
  }
});