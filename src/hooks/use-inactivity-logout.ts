import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const INACTIVITY_MS = 3 * 60 * 1000; // 3 minutes
const ACTIVITY_EVENTS: (keyof DocumentEventMap)[] = [
  "mousedown", "mousemove", "keydown", "scroll", "touchstart", "click",
];

export function useInactivityLogout(redirectTo: string) {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const timerRef = useRef<number>();

  useEffect(() => {
    const logout = async () => {
      await signOut();
      toast({ title: "Session expired", description: "You were logged out due to inactivity." });
      navigate(redirectTo, { replace: true });
    };

    const resetTimer = () => {
      window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => void logout(), INACTIVITY_MS);
    };

    resetTimer();
    ACTIVITY_EVENTS.forEach((e) => document.addEventListener(e, resetTimer, { passive: true }));

    return () => {
      window.clearTimeout(timerRef.current);
      ACTIVITY_EVENTS.forEach((e) => document.removeEventListener(e, resetTimer));
    };
  }, [signOut, navigate, redirectTo, toast]);
}
