import { useEffect, useState } from "react";
import { Car, ClipboardList, QrCode, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StatusBadge from "@/components/StatusBadge";
import QrGenerator from "@/components/QrGenerator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useInactivityLogout } from "@/hooks/use-inactivity-logout";

interface GuestPass {
  id: string;
  visitor_name: string;
  phone: string;
  vehicle_number: string;
  purpose: string | null;
  status: string;
  created_at: string;
  qr_payload: string;
}

interface ResidentSummary {
  owner_name: string;
  wing: string;
  flat_number: string;
  flat_label: string;
}

interface VisitLog {
  id: string;
  vehicle_number: string;
  owner_name: string;
  entry_type: string;
  entry_time: string;
  exit_time: string | null;
}

interface ResidentVehicle {
  id: string;
  vehicle_number: string;
  vehicle_type: string;
  owner_name: string;
  wing: string;
  flat_number: string;
  qr_code: string;
}

const emptyForm = {
  visitor_name: "",
  phone: "",
  vehicle_number: "",
  purpose: "",
};

const ResidentPortal = () => {
  useInactivityLogout("/resident");
  const [form, setForm] = useState(emptyForm);
  const [guestPasses, setGuestPasses] = useState<GuestPass[]>([]);
  const [visitLogs, setVisitLogs] = useState<VisitLog[]>([]);
  const [resident, setResident] = useState<ResidentSummary | null>(null);
  const [showQr, setShowQr] = useState<GuestPass | null>(null);
  const [vehicles, setVehicles] = useState<ResidentVehicle[]>([]);
  const [showVehicleQr, setShowVehicleQr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const loadGuestPasses = async () => {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke("resident-guest-passes", {
        body: { action: "list" },
      });

      setLoading(false);

      if (error || data?.error) {
        toast({
          title: "Could not load guest passes",
          description: error?.message ?? data?.error ?? "Please try again.",
          variant: "destructive",
        });
        return;
      }

      setResident(data.resident as ResidentSummary);
      setGuestPasses((data.passes ?? []) as GuestPass[]);
      setVisitLogs((data.visit_logs ?? []) as VisitLog[]);
    };

    if (user) {
      void loadGuestPasses();
    }
  }, [toast, user]);

  useEffect(() => {
    const loadVehicles = async () => {
      if (!resident) return;
      const { data, error } = await supabase
        .from("vehicles")
        .select("id, vehicle_number, vehicle_type, owner_name, wing, flat_number, qr_code")
        .eq("wing", resident.wing)
        .eq("flat_number", resident.flat_number)
        .order("created_at", { ascending: false });

      if (error) {
        toast({
          title: "Could not load your vehicles",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      setVehicles((data ?? []) as ResidentVehicle[]);
    };

    void loadVehicles();
  }, [resident, toast]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/resident", { replace: true });
  };

  const generateGuestPass = async () => {
    if (!form.visitor_name.trim() || !form.phone.trim() || !form.vehicle_number.trim()) {
      toast({ title: "Fill all required guest details", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke("resident-guest-passes", {
      body: {
        action: "create",
        visitor_name: form.visitor_name.trim(),
        phone: form.phone.trim(),
        vehicle_number: form.vehicle_number.trim().toUpperCase(),
        purpose: form.purpose || null,
      },
    });
    setSubmitting(false);

    if (error || data?.error) {
      toast({
        title: "Could not create guest pass",
        description: error?.message ?? data?.error ?? "Please try again.",
        variant: "destructive",
      });
      return;
    }

    const createdPass = data.pass as GuestPass;
    setResident(data.resident as ResidentSummary);
    setGuestPasses((prev) => [createdPass, ...prev.filter((pass) => pass.id !== createdPass.id)].slice(0, 5));
    setForm(emptyForm);
    setShowQr(createdPass);
    toast({ title: "Guest pass created", description: `${createdPass.visitor_name} can now use this QR at the gate.` });
  };

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
          <h1 className="text-2xl font-bold text-foreground">Resident Portal</h1>
          <p className="text-muted-foreground text-sm">{resident ? `${resident.flat_label} • ${resident.owner_name}` : "Resident profile unavailable"}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={handleSignOut} className="touch-target text-muted-foreground hover:text-destructive">
          <Power className="h-5 w-5" />
        </Button>
      </div>

      {/* Generate Guest Pass */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <QrCode className="h-5 w-5 text-primary" />
            Generate Guest Pass
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="guest-name">Guest Name *</Label>
              <Input id="guest-name" placeholder="Enter guest's name" value={form.visitor_name} onChange={(e) => setForm((prev) => ({ ...prev, visitor_name: e.target.value }))} className="touch-target" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="guest-phone">Phone Number *</Label>
              <Input id="guest-phone" placeholder="Enter phone number" value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} className="touch-target" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="guest-vehicle">Vehicle Number *</Label>
              <Input id="guest-vehicle" placeholder="e.g. MH02AB1234" value={form.vehicle_number} onChange={(e) => setForm((prev) => ({ ...prev, vehicle_number: e.target.value.toUpperCase() }))} className="touch-target" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="guest-purpose">Purpose of Visit</Label>
              <Select value={form.purpose || undefined} onValueChange={(value) => setForm((prev) => ({ ...prev, purpose: value }))}>
                <SelectTrigger id="guest-purpose" className="touch-target">
                  <SelectValue placeholder="Select purpose" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Guest Visit">Guest Visit</SelectItem>
                  <SelectItem value="Delivery">Delivery</SelectItem>
                  <SelectItem value="Cab/Taxi">Cab / Taxi</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {resident && (
            <div className="rounded-lg border border-border bg-secondary/40 p-3 text-sm text-muted-foreground">
              Entry will be created for <span className="font-medium text-foreground">{resident.owner_name}</span> • <span className="font-medium text-foreground">{resident.flat_label}</span>
            </div>
          )}

          <Button onClick={() => void generateGuestPass()} className="touch-target gap-2" disabled={submitting || !resident}>
              <QrCode className="h-4 w-4" />
              {submitting ? "Generating..." : "Generate QR Pass"}
            </Button>

          {showQr && resident && (
            <div className="flex justify-center">
              <QrGenerator value={showQr.qr_payload} label={`${showQr.visitor_name} • ${resident.flat_label}`} size={400} />
            </div>
          )}

          {guestPasses.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Latest 5 Guest QR Passes</p>
              {guestPasses.map((pass) => (
                <div key={pass.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">{pass.visitor_name}</p>
                      <StatusBadge status={pass.status === "entered" ? "inside" : "approved"} />
                    </div>
                    <p className="text-xs text-muted-foreground">{pass.vehicle_number} • {pass.phone}</p>
                    <p className="text-xs text-muted-foreground">{pass.purpose || "Guest Visit"} • {new Date(pass.created_at).toLocaleString()}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setShowQr(pass)} className="touch-target gap-1">
                    <QrCode className="h-4 w-4" />
                    Open QR
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* My Vehicles */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Car className="h-5 w-5 text-primary" />
            My Vehicles ({vehicles.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {vehicles.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No vehicles registered to your flat yet
              </p>
            ) : (
              vehicles.map((v) => (
                <div key={v.id} className="space-y-2">
                  <div className="flex items-center gap-3 justify-between p-3 rounded-lg bg-secondary/50 border border-border">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-foreground">{v.vehicle_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {v.owner_name} • {v.wing}-{v.flat_number} • {v.vehicle_type}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setShowVehicleQr(showVehicleQr === v.qr_code ? null : v.qr_code)
                      }
                      className="touch-target gap-1"
                    >
                      <QrCode className="h-4 w-4" />
                      QR
                    </Button>
                  </div>
                  {showVehicleQr === v.qr_code && (
                    <div className="flex justify-center py-2">
                      <QrGenerator
                        value={v.qr_code}
                        label={`${v.vehicle_number} • ${v.wing}-${v.flat_number}`}
                        size={400}
                        wing={v.wing}
                      />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Visit Logs */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ClipboardList className="h-5 w-5 text-accent" />
            Visit History
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {visitLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No visit history</p>
          ) : (
            visitLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">{log.owner_name}</p>
                    <StatusBadge status={log.exit_time ? "exited" : "inside"} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {log.vehicle_number} • {log.entry_type} • {new Date(log.entry_time).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResidentPortal;
