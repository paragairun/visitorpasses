import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { supabase } from "@/integrations/supabase/client";

/**
 * Registers this device for push notifications when the app is running
 * inside the native Android wrapper (Capacitor) -- a no-op in a regular
 * browser tab, since there's no native push channel there.
 *
 * On success, upserts the FCM device token against the current user so the
 * send-push-notification edge function can look it up later. Call this once
 * per dashboard, after the user is confirmed logged in (needs a real user id
 * to attach the token to).
 */
export function usePushNotifications(userId: string | undefined) {
  useEffect(() => {
    if (!userId || !Capacitor.isNativePlatform()) return;

    let cancelled = false;

    const setup = async () => {
      const permStatus = await PushNotifications.checkPermissions();
      let granted = permStatus.receive === "granted";

      if (permStatus.receive === "prompt") {
        const req = await PushNotifications.requestPermissions();
        granted = req.receive === "granted";
      }

      if (!granted || cancelled) return;

      await PushNotifications.register();
    };

    const registrationListener = PushNotifications.addListener("registration", async (token) => {
      if (cancelled) return;
      const { error } = await supabase.from("device_push_tokens").upsert(
        { user_id: userId, token: token.value, platform: "android" },
        { onConflict: "user_id,token" }
      );
      if (error) console.error("Failed to save push token:", error);
    });

    const errorListener = PushNotifications.addListener("registrationError", (err) => {
      console.error("Push registration error:", err);
    });

    void setup();

    return () => {
      cancelled = true;
      void registrationListener.then((l) => l.remove());
      void errorListener.then((l) => l.remove());
    };
  }, [userId]);
}
