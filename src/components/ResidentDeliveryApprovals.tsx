import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle, XCircle, Package, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSocietyStructure } from "@/hooks/useSocietyStructure";

const DELIVERY_TYPES: Record<string, string> = {
  amazon: "📦 Amazon", flipkart: "🛒 Flipkart", zomato: "🍕 Zomato",
  swiggy: "🛵 Swiggy", blinkit: "⚡ Blinkit", zepto: "🟣 Zepto",
  milk: "🥛 Milk", grocery: "🛍️ Grocery", courier: "📮 Courier", other: "📬 Delivery",
};

interface DeliveryVisit {
  id: string; mobile: string; photo_base64: string | null;
  delivery_type: string; agent_name: string | null;
  wing: string; flat_number: string;
  status: "pending_approval" | "approved" | "rejected" | "completed" | "expired";
  entry_time: string; expires_at: string;
}

interface ResidentDeliveryApprovalsProps {
  /** Called when pending count changes — parent uses this to show badge */
  onPendingCountChange?: (count: number) => void;
}

/**
 * A continuously looping phone-ring sound built with Web Audio API (no audio file needed).
 * Call .start() to begin ringing, .stop() to silence it. Safe to call start/stop repeatedly.
 */
class RingtonePlayer {
  private ctx: AudioContext | null = null;
  private timeoutId: number | null = null;
  private playing = false;

  private ensureContext() {
    if (!this.ctx) {
      const AudioCtor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtor();
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  /** Plays one "ring-ring... pause" cycle, classic phone ring pattern (~3.5s) */
  private playCycle() {
    if (!this.playing) return;
    const ctx = this.ensureContext();
    const now = ctx.currentTime;

    // Two-tone "ring ring" (like a classic phone), twice, then a pause
    const ringTone = (startAt: number, duration: number) => {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc1.frequency.value = 480;
      osc2.frequency.value = 620;
      osc1.type = "sine";
      osc2.type = "sine";
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0, startAt);
      gain.gain.linearRampToValueAtTime(0.25, startAt + 0.05);
      gain.gain.setValueAtTime(0.25, startAt + duration - 0.05);
      gain.gain.linearRampToValueAtTime(0, startAt + duration);
      osc1.start(startAt); osc2.start(startAt);
      osc1.stop(startAt + duration); osc2.stop(startAt + duration);
    };

    // Standard ring cadence: 1s on, 0.4s off, 1s on, then 2s pause before next cycle
    ringTone(now, 1.0);
    ringTone(now + 1.4, 1.0);

    this.timeoutId = window.setTimeout(() => this.playCycle(), 3500);
  }

  start() {
    if (this.playing) return;
    this.playing = true;
    this.playCycle();
  }

  stop() {
    this.playing = false;
    if (this.timeoutId !== null) {
      window.clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}

const ringtone = new RingtonePlayer();

// Browsers block audio until the user interacts with the page at least once.
// This silently "warms up" the audio context on the first tap/click anywhere,
// so the ringtone can play automatically once a delivery notification arrives.
if (typeof document !== "undefined") {
  const unlockAudio = () => {
    try {
      const AudioCtor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtor();
      if (ctx.state === "suspended") void ctx.resume();
      void ctx.close();
    } catch { /* ignore */ }
    document.removeEventListener("click", unlockAudio);
    document.removeEventListener("touchstart", unlockAudio);
  };
  document.addEventListener("click", unlockAudio, { once: true });
  document.addEventListener("touchstart", unlockAudio, { once: true });
}

const ResidentDeliveryApprovals = ({ onPendingCountChange }: ResidentDeliveryApprovalsProps) => {
  const { user, societyId } = useAuth();
  const { formatFlat } = useSocietyStructure(societyId);
  const { toast } = useToast();
  const [visits, setVisits] = useState<DeliveryVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const prevPendingIds = useRef<Set<string>>(new Set());
  const hasAlertedToast = useRef<Set<string>>(new Set());

  const fetchVisits = useCallback(async () => {
    if (!user || !societyId) return;

    // Get all flats this resident has
    const { data: flatData } = await supabase
      .from("resident_flats")
      .select("wing, flat_number")
      .eq("user_id", user.id);

    if (!flatData || flatData.length === 0) { setLoading(false); return; }

    // Fetch delivery visits for all their flats — today + recent
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const flatFilters = flatData.map((f: { wing: string; flat_number: string }) =>
      `and(wing.eq.${f.wing},flat_number.eq.${f.flat_number})`
    ).join(",");

    const { data } = await supabase
      .from("delivery_visits")
      .select("*")
      .eq("society_id", societyId)
      .or(flatFilters)
      .gte("entry_time", since)
      .not("status", "in", '("completed","expired")')
      .order("entry_time", { ascending: false });

    const newVisits = (data ?? []) as DeliveryVisit[];
    const pendingVisits = newVisits.filter((v) => v.status === "pending_approval");
    const newPendingIds = new Set(pendingVisits.map((v) => v.id));

    // Toast once per delivery (first time we see it as pending); ringtone keeps going independently
    pendingVisits.forEach((v) => {
      if (!hasAlertedToast.current.has(v.id)) {
        hasAlertedToast.current.add(v.id);
        toast({ title: "🔔 New delivery at your gate!", description: "A delivery is waiting for your approval." });
      }
    });
    prevPendingIds.current = newPendingIds;

    // Ring continuously while there is at least one pending approval; stop otherwise
    if (newPendingIds.size > 0) ringtone.start();
    else ringtone.stop();

    setVisits(newVisits);
    onPendingCountChange?.(newPendingIds.size);
    setLoading(false);
  }, [user, societyId, onPendingCountChange, toast]);

  useEffect(() => {
    void fetchVisits();
    const interval = window.setInterval(() => void fetchVisits(), 10000);
    return () => {
      window.clearInterval(interval);
      ringtone.stop(); // stop ringing if resident navigates away from this page
    };
  }, [fetchVisits]);

  const handleDecision = async (visit: DeliveryVisit, approve: boolean) => {
    if (!user) return;
    setProcessing(visit.id);
    const { error } = await supabase.from("delivery_visits").update({
      status: approve ? "approved" : "rejected",
      approved_by: user.id,
    }).eq("id", visit.id);
    setProcessing(null);
    if (error) { toast({ title: "Failed to update", description: error.message, variant: "destructive" }); return; }
    toast({ title: approve ? "✅ Delivery approved" : "❌ Delivery rejected", description: `${DELIVERY_TYPES[visit.delivery_type] ?? "Delivery"} for ${formatFlat(visit.wing, visit.flat_number)}` });
    await fetchVisits();
  };

  const pending = visits.filter((v) => v.status === "pending_approval");
  const approved = visits.filter((v) => v.status === "approved");
  const rejected = visits.filter((v) => v.status === "rejected");

  const VisitCard = ({ v, showActions }: { v: DeliveryVisit; showActions: boolean }) => {
    const typeLabel = DELIVERY_TYPES[v.delivery_type] ?? "📬 Delivery";
    const timeStr = new Date(v.entry_time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    const expiresIn = Math.max(0, Math.round((new Date(v.expires_at).getTime() - Date.now()) / 60000));

    return (
      <div className={`rounded-lg border p-3 space-y-3 ${showActions ? "border-warning/50 bg-warning/5" : v.status === "approved" ? "border-success/30 bg-success/5" : "border-border bg-secondary/20"}`}>
        <div className="flex items-start gap-3">
          {v.photo_base64 ? (
            <img src={v.photo_base64} alt="agent" className="h-16 w-16 rounded-lg object-cover shrink-0" />
          ) : (
            <div className="h-16 w-16 rounded-lg bg-secondary flex items-center justify-center text-3xl shrink-0">
              {typeLabel.split(" ")[0]}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold">{typeLabel}</p>
            <p className="text-sm text-muted-foreground">{formatFlat(v.wing, v.flat_number)}</p>
            <p className="text-sm text-muted-foreground">📱 {v.mobile}{v.agent_name ? ` • ${v.agent_name}` : ""}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Arrived at {timeStr}</p>
            {showActions && expiresIn > 0 && (
              <p className="text-xs text-warning flex items-center gap-1 mt-0.5">
                <Clock className="h-3 w-3" /> Expires in {expiresIn} min
              </p>
            )}
          </div>
        </div>
        {showActions && (
          <div className="grid grid-cols-2 gap-2">
            <Button variant="destructive" size="sm" className="gap-1 w-full"
              onClick={() => void handleDecision(v, false)} disabled={processing === v.id}>
              <XCircle className="h-4 w-4" /> Reject
            </Button>
            <Button size="sm" className="gap-1 w-full bg-success hover:bg-success/80"
              onClick={() => void handleDecision(v, true)} disabled={processing === v.id}>
              <CheckCircle className="h-4 w-4" /> Approve
            </Button>
          </div>
        )}
        {!showActions && (
          <p className={`text-xs font-medium ${v.status === "approved" ? "text-success" : "text-destructive"}`}>
            {v.status === "approved" ? "✅ You approved this delivery" : "❌ You rejected this delivery"}
          </p>
        )}
      </div>
    );
  };

  if (loading) {
    return <div className="py-8 flex justify-center"><div className="h-6 w-6 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (visits.length === 0) {
    return (
      <div className="py-12 text-center space-y-2">
        <Package className="h-10 w-10 text-muted-foreground mx-auto" />
        <p className="text-sm text-muted-foreground">No deliveries today.</p>
        <p className="text-xs text-muted-foreground">When a delivery arrives at the gate, you'll be alerted here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pending.length > 0 && (
        <Card className="border-warning/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-warning flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-warning animate-pulse" />
              Waiting for your approval ({pending.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pending.map((v) => <VisitCard key={v.id} v={v} showActions={true} />)}
          </CardContent>
        </Card>
      )}

      {approved.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Approved today</p>
          {approved.map((v) => <VisitCard key={v.id} v={v} showActions={false} />)}
        </div>
      )}

      {rejected.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Rejected today</p>
          {rejected.map((v) => <VisitCard key={v.id} v={v} showActions={false} />)}
        </div>
      )}
    </div>
  );
};

export default ResidentDeliveryApprovals;
