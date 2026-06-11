import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Check, X, LogOut, ShieldCheck, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import StatusBadge from "@/components/StatusBadge";

interface SocietyRow {
  id: string; name: string; city: string; state: string; status: string; created_at: string;
}
interface RegRow {
  id: string; society_name: string; address_line: string; landmark: string | null;
  city: string; state: string; country: string; pin_code: string;
  admin_email: string; admin_display_name: string; admin_phone: string | null;
  status: string; rejection_reason: string | null; created_at: string;
}

const SuperAdminDashboard = () => {
  const { toast } = useToast();
  const { signOut, user, roles, loading } = useAuth();
  const navigate = useNavigate();
  const isSuper = roles.includes("super_admin");

  const [societies, setSocieties] = useState<SocietyRow[]>([]);
  const [requests, setRequests] = useState<RegRow[]>([]);
  const [working, setWorking] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<RegRow | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const load = useCallback(async () => {
    const [{ data: socs }, { data: reqs }] = await Promise.all([
      supabase.from("societies").select("id, name, city, state, status, created_at").order("created_at", { ascending: false }),
      supabase.from("society_registration_requests").select("*").order("created_at", { ascending: false }),
    ]);
    setSocieties((socs ?? []) as SocietyRow[]);
    setRequests((reqs ?? []) as RegRow[]);
  }, []);

  useEffect(() => {
    if (!loading && !user) { navigate("/admin", { replace: true }); return; }
    if (!loading && user && !isSuper) {
      toast({ title: "Super-admin access required", variant: "destructive" });
      navigate("/", { replace: true });
      return;
    }
    if (user && isSuper) void load();
  }, [user, loading, isSuper, navigate, toast, load]);

  const approve = async (r: RegRow) => {
    setWorking(r.id);
    const { data, error } = await supabase.functions.invoke("approve-society", {
      body: { request_id: r.id, action: "approve" },
    });
    setWorking(null);
    if (error || data?.error) {
      toast({ title: "Approval failed", description: error?.message ?? data?.error, variant: "destructive" });
      return;
    }
    toast({ title: `Society "${r.society_name}" approved`, description: `Admin ${r.admin_email} can now log in.` });
    await load();
  };

  const reject = async () => {
    if (!rejecting) return;
    setWorking(rejecting.id);
    const { data, error } = await supabase.functions.invoke("approve-society", {
      body: { request_id: rejecting.id, action: "reject", reason: rejectReason.trim() || null },
    });
    setWorking(null);
    if (error || data?.error) {
      toast({ title: "Rejection failed", description: error?.message ?? data?.error, variant: "destructive" });
      return;
    }
    toast({ title: "Request rejected" });
    setRejecting(null); setRejectReason("");
    await load();
  };

  if (loading || !isSuper) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const pending = requests.filter((r) => r.status === "pending");
  const processed = requests.filter((r) => r.status !== "pending").slice(0, 10);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-bold text-foreground">Platform Super Admin</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={async () => { await signOut(); navigate("/", { replace: true }); }} className="gap-1">
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="grid sm:grid-cols-3 gap-4">
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Active societies</p><p className="text-3xl font-bold">{societies.filter(s => s.status === "active").length}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Pending requests</p><p className="text-3xl font-bold">{pending.length}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total societies</p><p className="text-3xl font-bold">{societies.length}</p></CardContent></Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5 text-primary" /> Pending Society Registrations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pending.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No pending requests.</p>
            ) : pending.map((r) => (
              <div key={r.id} className="border border-border rounded-lg p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-lg text-foreground">{r.society_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {r.address_line}{r.landmark ? `, ${r.landmark}` : ""}, {r.city}, {r.state} {r.pin_code}, {r.country}
                    </p>
                    <p className="text-sm text-foreground mt-2">
                      <span className="font-semibold">Admin:</span> {r.admin_display_name} • {r.admin_email}
                      {r.admin_phone && ` • ${r.admin_phone}`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(r.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" onClick={() => void approve(r)} disabled={working === r.id} className="gap-1 bg-success hover:bg-success/80">
                      <Check className="h-4 w-4" /> Approve
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => { setRejecting(r); setRejectReason(""); }} disabled={working === r.id} className="gap-1">
                      <X className="h-4 w-4" /> Reject
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" /> Societies ({societies.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {societies.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/40 border border-border">
                <div>
                  <p className="font-semibold text-foreground">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.city}, {s.state}</p>
                </div>
                <StatusBadge status={s.status === "active" ? "approved" : s.status === "suspended" ? "rejected" : "pending"} />
              </div>
            ))}
          </CardContent>
        </Card>

        {processed.length > 0 && (
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Recently processed requests</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {processed.map((r) => (
                <div key={r.id} className="flex items-center justify-between text-sm p-2 border border-border rounded">
                  <span className="font-medium">{r.society_name} <span className="text-muted-foreground">• {r.admin_email}</span></span>
                  <StatusBadge status={r.status === "approved" ? "approved" : "rejected"} />
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </main>

      <Dialog open={!!rejecting} onOpenChange={(o) => !o && setRejecting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject "{rejecting?.society_name}"?</DialogTitle>
            <DialogDescription>Optionally tell them why so they can resubmit.</DialogDescription>
          </DialogHeader>
          <Textarea placeholder="Reason (optional)" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejecting(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => void reject()} disabled={working !== null}>Reject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuperAdminDashboard;
