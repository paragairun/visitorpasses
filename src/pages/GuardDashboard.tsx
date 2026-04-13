import { useCallback, useEffect, useState } from "react";
import { ScanLine, Check, X, LogOut, Car, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StatusBadge from "@/components/StatusBadge";
import QrScanner from "@/components/QrScanner";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type VisitorRequest = Tables<"visitor_requests">;
type EntryLog = Tables<"entry_logs">;
type Vehicle = Tables<"vehicles">;

const GuardDashboard = () => {
  const [scanning, setScanning] = useState(false);
  const [visitors, setVisitors] = useState<VisitorRequest[]>([]);
  const [liveVehicles, setLiveVehicles] = useState<EntryLog[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { toast } = useToast();
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  const loadDashboardData = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);

    const [visitorsResult, entriesResult, vehiclesResult] = await Promise.all([
      supabase.from("visitor_requests").select("*").order("created_at", { ascending: false }),
      supabase.from("entry_logs").select("*").is("exit_time", null).order("entry_time", { ascending: false }),
      supabase.from("vehicles").select("*").order("created_at", { ascending: false }),
    ]);

    if (visitorsResult.error) {
      toast({ title: "Could not load visitor requests", description: visitorsResult.error.message, variant: "destructive" });
    } else {
      setVisitors((visitorsResult.data ?? []) as VisitorRequest[]);
    }

    if (entriesResult.error) {
      toast({ title: "Could not load live entries", description: entriesResult.error.message, variant: "destructive" });
    } else {
      setLiveVehicles((entriesResult.data ?? []) as EntryLog[]);
    }

    if (vehiclesResult.error) {
      toast({ title: "Could not load vehicles", description: vehiclesResult.error.message, variant: "destructive" });
    } else {
      setVehicles((vehiclesResult.data ?? []) as Vehicle[]);
    }

    if (showLoader) setLoading(false);
  }, [toast]);

  useEffect(() => {
    void loadDashboardData(true);

    const interval = window.setInterval(() => {
      void loadDashboardData(false);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [loadDashboardData]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/guard", { replace: true });
  };

  const handleScan = async (result: string) => {
    setScanning(false);
    const vehicle = vehicles.find((v) => v.qr_code === result);

    if (vehicle) {
      const { error } = await supabase.from("entry_logs").insert({
        vehicle_number: vehicle.vehicle_number,
        flat_number: vehicle.flat_number,
        wing: vehicle.wing,
        entry_type: "resident",
        owner_name: vehicle.owner_name,
        logged_by: user?.id ?? null,
      });

      if (error) {
        toast({ title: "Could not log entry", description: error.message, variant: "destructive" });
        return;
      }

      setScanResult(`✅ ${vehicle.owner_name} — ${vehicle.wing}-${vehicle.flat_number} — ${vehicle.vehicle_number}`);
      await loadDashboardData(false);
      toast({ title: "Entry Logged", description: `${vehicle.owner_name} — ${vehicle.vehicle_number}` });
    } else {
      setScanResult("❌ Unknown QR code. Vehicle not registered.");
      toast({ title: "Unknown Vehicle", description: "QR code not found in registry.", variant: "destructive" });
    }
    setTimeout(() => setScanResult(null), 5000);
  };

  const handleApprove = async (id: string) => {
    const visitor = visitors.find((v) => v.id === id);
    if (!visitor) return;

    setProcessingId(id);

    const { error: updateError } = await supabase
      .from("visitor_requests")
      .update({ status: "approved" })
      .eq("id", id);

    if (updateError) {
      setProcessingId(null);
      toast({ title: "Approval failed", description: updateError.message, variant: "destructive" });
      return;
    }

    const { error: entryError } = await supabase.from("entry_logs").insert({
      vehicle_number: visitor.vehicle_number,
      flat_number: visitor.flat_number,
      wing: "",
      entry_type: "visitor",
      owner_name: `${visitor.visitor_name} (Visitor)`,
      logged_by: user?.id ?? null,
    });

    setProcessingId(null);

    if (entryError) {
      toast({ title: "Approval saved but entry log failed", description: entryError.message, variant: "destructive" });
      return;
    }

    await loadDashboardData(false);
    toast({ title: "Visitor Approved", description: visitor?.visitor_name });
  };

  const handleReject = async (id: string) => {
    setProcessingId(id);

    const { error } = await supabase
      .from("visitor_requests")
      .update({ status: "rejected" })
      .eq("id", id);

    setProcessingId(null);

    if (error) {
      toast({ title: "Rejection failed", description: error.message, variant: "destructive" });
      return;
    }

    await loadDashboardData(false);
    toast({ title: "Visitor Rejected", variant: "destructive" });
  };

  const handleCheckout = async (id: string) => {
    setProcessingId(id);

    const { error } = await supabase
      .from("entry_logs")
      .update({ exit_time: new Date().toISOString() })
      .eq("id", id);

    setProcessingId(null);

    if (error) {
      toast({ title: "Checkout failed", description: error.message, variant: "destructive" });
      return;
    }

    await loadDashboardData(false);
    toast({ title: "Vehicle Checked Out" });
  };

  const pendingVisitors = visitors.filter((v) => v.status === "pending");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Guard Dashboard</h1>
          <p className="text-muted-foreground text-sm">Triumph Tower CHSL</p>
        </div>
        <div className="flex gap-2">
        <Button variant="ghost" size="icon" onClick={handleSignOut} className="touch-target text-muted-foreground hover:text-destructive">
          <Power className="h-5 w-5" />
        </Button>
        <Button
          size="lg"
          onClick={() => setScanning(true)}
          className="touch-target gap-2 text-lg font-bold animate-pulse-glow"
        >
          <ScanLine className="h-6 w-6" />
          Scan Sticker
        </Button>
        </div>
      </div>

      {scanResult && (
        <Card className="border-primary/50 bg-primary/10">
          <CardContent className="p-4 text-center text-lg font-bold text-foreground">
            {scanResult}
          </CardContent>
        </Card>
      )}

      {/* Pending Visitor Approvals */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <span className="h-3 w-3 rounded-full bg-warning animate-pulse" />
            Pending Approvals ({pendingVisitors.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {pendingVisitors.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No pending requests</p>
          ) : (
            pendingVisitors.map((visitor) => (
              <div key={visitor.id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-secondary/50 border border-border">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-foreground truncate">{visitor.visitor_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {visitor.vehicle_number} → {visitor.flat_number} • {visitor.purpose}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="icon" onClick={() => void handleApprove(visitor.id)} className="touch-target bg-success hover:bg-success/80" disabled={processingId === visitor.id}>
                    <Check className="h-5 w-5" />
                  </Button>
                  <Button size="icon" variant="destructive" onClick={() => void handleReject(visitor.id)} className="touch-target" disabled={processingId === visitor.id}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Live Inside */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Car className="h-5 w-5 text-primary" />
            Live Inside ({liveVehicles.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {liveVehicles.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No active entries</p>
          ) : (
            liveVehicles.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-secondary/50 border border-border">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-foreground">{entry.vehicle_number}</p>
                    <StatusBadge status={entry.entry_type === "visitor" ? "pending" : "inside"} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {entry.owner_name} {entry.wing && `• ${entry.wing}-${entry.flat_number}`} • {new Date(entry.entry_time).toLocaleTimeString()}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => void handleCheckout(entry.id)} className="touch-target gap-1 border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground" disabled={processingId === entry.id}>
                  <LogOut className="h-4 w-4" />
                  Out
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {scanning && <QrScanner onScan={handleScan} onClose={() => setScanning(false)} />}
    </div>
  );
};

export default GuardDashboard;
