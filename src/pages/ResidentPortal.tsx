import { useCallback, useEffect, useState } from "react";
import { Car, ClipboardList, QrCode, Power, Plus, Trash2, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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

interface ChangeRequestRow {
  id: string;
  request_type: string;
  vehicle_number: string;
  vehicle_type: string;
  owner_name: string;
  wing: string;
  flat_number: string;
  status: string;
  notes: string | null;
  created_at: string;
}

const emptyForm = {
  visitor_name: "",
  phone: "",
  vehicle_number: "",
  purpose: "",
};

const emptyVehicleRequest = {
  vehicle_number: "",
  vehicle_type: "car",
  owner_name: "",
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
  const [vehicleReqForm, setVehicleReqForm] = useState(emptyVehicleRequest);
  const [submittingVehicleReq, setSubmittingVehicleReq] = useState(false);
  const [changeRequests, setChangeRequests] = useState<ChangeRequestRow[]>([]);
  const [removeTarget, setRemoveTarget] = useState<ResidentVehicle | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
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

  const loadVehicles = useCallback(async () => {
    if (!resident) return;
    const { data, error } = await supabase
      .from("vehicles")
      .select("id, vehicle_number, vehicle_type, owner_name, wing, flat_number, qr_code")
      .eq("wing", resident.wing)
      .eq("flat_number", resident.flat_number)
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Could not load your vehicles", description: error.message, variant: "destructive" });
      return;
    }
    setVehicles((data ?? []) as ResidentVehicle[]);
  }, [resident, toast]);

  const loadChangeRequests = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("vehicle_change_requests")
      .select("id, request_type, vehicle_number, vehicle_type, owner_name, wing, flat_number, status, notes, created_at")
      .eq("requested_by", user.id)
      .order("created_at", { ascending: false })
      .limit(10);
    if (error) return;
    setChangeRequests((data ?? []) as ChangeRequestRow[]);
  }, [user]);

  useEffect(() => { void loadVehicles(); }, [loadVehicles]);
  useEffect(() => { void loadChangeRequests(); }, [loadChangeRequests]);

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

  const submitAddVehicleRequest = async () => {
    if (!resident || !user) return;
    if (!vehicleReqForm.vehicle_number.trim() || !vehicleReqForm.owner_name.trim()) {
      toast({ title: "Fill vehicle number and owner name", variant: "destructive" });
      return;
    }
    setSubmittingVehicleReq(true);
    const { error } = await supabase.from("vehicle_change_requests").insert({
      request_type: "add",
      requested_by: user.id,
      wing: resident.wing,
      flat_number: resident.flat_number,
      owner_name: vehicleReqForm.owner_name.trim(),
      vehicle_number: vehicleReqForm.vehicle_number.trim().toUpperCase(),
      vehicle_type: vehicleReqForm.vehicle_type,
    });
    setSubmittingVehicleReq(false);
    if (error) {
      toast({ title: "Could not submit request", description: error.message, variant: "destructive" });
      return;
    }
    setVehicleReqForm(emptyVehicleRequest);
    toast({ title: "Request sent", description: "Admin will review your new vehicle request." });
    await loadChangeRequests();
  };

  const submitRemoveRequest = async () => {
    if (!resident || !user || !removeTarget) return;
    setRemovingId(removeTarget.id);
    const { error } = await supabase.from("vehicle_change_requests").insert({
      request_type: "remove",
      requested_by: user.id,
      wing: removeTarget.wing,
      flat_number: removeTarget.flat_number,
      owner_name: removeTarget.owner_name,
      vehicle_number: removeTarget.vehicle_number,
      vehicle_type: removeTarget.vehicle_type,
      target_vehicle_id: removeTarget.id,
    });
    setRemovingId(null);
    setRemoveTarget(null);
    if (error) {
      toast({ title: "Could not submit request", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Removal requested", description: "Admin will review your request." });
    await loadChangeRequests();
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
              <QrGenerator
                value={showQr.qr_payload}
                label={`${showQr.visitor_name} • ${resident.flat_label}`}
                size={400}
                shareText={`Hi ${showQr.visitor_name}, here is your gate entry QR for ${resident.flat_label}. Show this to the security guard at the gate.`}
                fileBaseName={`${resident.flat_label}-${showQr.vehicle_number || showQr.visitor_name}`}
              />
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
        <CardContent className="space-y-4">
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
                    <div className="flex items-center gap-2">
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setRemoveTarget(v)}
                        disabled={removingId === v.id}
                        className="touch-target gap-1 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </Button>
                    </div>
                  </div>
                  {showVehicleQr === v.qr_code && (
                    <div className="flex justify-center py-2">
                      <QrGenerator
                        value={v.qr_code}
                        label={`${v.vehicle_number} • ${v.wing}-${v.flat_number}`}
                        size={400}
                        wing={v.wing}
                        fileBaseName={`${v.wing}-${v.flat_number}-${v.vehicle_number}`}
                      />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Request new vehicle */}
          <div className="rounded-lg border border-dashed border-border p-3 space-y-3">
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium text-foreground">Request New Vehicle</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Submit a request to register a new vehicle. Admin approval is required.
            </p>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="req-owner">Owner Name *</Label>
                <Input
                  id="req-owner"
                  placeholder="Full name"
                  value={vehicleReqForm.owner_name}
                  onChange={(e) => setVehicleReqForm((p) => ({ ...p, owner_name: e.target.value }))}
                  className="touch-target"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="req-vnum">Vehicle Number *</Label>
                <Input
                  id="req-vnum"
                  placeholder="MH02AB1234"
                  value={vehicleReqForm.vehicle_number}
                  onChange={(e) => setVehicleReqForm((p) => ({ ...p, vehicle_number: e.target.value.toUpperCase() }))}
                  className="touch-target"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="req-vtype">Type</Label>
                <Select
                  value={vehicleReqForm.vehicle_type}
                  onValueChange={(v) => setVehicleReqForm((p) => ({ ...p, vehicle_type: v }))}
                >
                  <SelectTrigger id="req-vtype" className="touch-target"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="car">Car</SelectItem>
                    <SelectItem value="bike">Bike</SelectItem>
                    <SelectItem value="scooty">Scooty</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              onClick={() => void submitAddVehicleRequest()}
              disabled={submittingVehicleReq || !resident}
              className="touch-target gap-2"
            >
              <Plus className="h-4 w-4" />
              {submittingVehicleReq ? "Submitting..." : "Send Request to Admin"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* My Change Requests */}
      {changeRequests.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ClipboardCheck className="h-5 w-5 text-primary" />
              My Vehicle Requests
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {changeRequests.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase font-bold text-muted-foreground">{r.request_type}</span>
                    <p className="font-medium text-foreground">{r.vehicle_number}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {r.owner_name} • {r.wing}-{r.flat_number} • {new Date(r.created_at).toLocaleString()}
                  </p>
                  {r.notes && <p className="text-xs text-muted-foreground italic">Admin note: {r.notes}</p>}
                </div>
                <StatusBadge status={r.status as "pending" | "approved" | "rejected"} />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

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

      <AlertDialog open={!!removeTarget} onOpenChange={(o) => !o && setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Request vehicle removal?</AlertDialogTitle>
            <AlertDialogDescription>
              {removeTarget && (
                <>
                  This will send a removal request to the admin for{" "}
                  <span className="font-semibold">{removeTarget.vehicle_number}</span> ({removeTarget.owner_name}).
                  The vehicle stays active until the admin approves.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void submitRemoveRequest()}>
              Send Request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ResidentPortal;
