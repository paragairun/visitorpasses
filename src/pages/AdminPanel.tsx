import { useCallback, useEffect, useState } from "react";
import { Plus, QrCode, Car, BarChart3, Shield, Power, Trash2 } from "lucide-react";
import RegistrationRequests from "@/components/RegistrationRequests";
import CsvUpload from "@/components/CsvUpload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import QrGenerator from "@/components/QrGenerator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useInactivityLogout } from "@/hooks/use-inactivity-logout";

type Vehicle = Tables<"vehicles">;

const AdminPanel = () => {
  useInactivityLogout("/admin");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [showQrFor, setShowQrFor] = useState<string | null>(null);
  const [newVehicle, setNewVehicle] = useState({ flat_number: "", wing: "A", vehicle_number: "", vehicle_type: "car", owner_name: "" });
  const [stats, setStats] = useState({ total_vehicles: 0, currently_inside: 0, today_entries: 0 });
  const [loading, setLoading] = useState(true);
  const [savingVehicle, setSavingVehicle] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const handleSignOut = async () => { await signOut(); navigate("/admin", { replace: true }); };

  const fetchAdminData = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [vehiclesResult, insideResult, todayResult] = await Promise.all([
      supabase.from("vehicles").select("*").order("created_at", { ascending: false }),
      supabase.from("entry_logs").select("id", { count: "exact", head: true }).is("exit_time", null),
      supabase.from("entry_logs").select("id", { count: "exact", head: true }).gte("entry_time", startOfDay.toISOString()),
    ]);

    if (vehiclesResult.error) {
      toast({ title: "Could not load vehicles", description: vehiclesResult.error.message, variant: "destructive" });
    } else {
      const nextVehicles = (vehiclesResult.data ?? []) as Vehicle[];
      setVehicles(nextVehicles);
      setStats((prev) => ({ ...prev, total_vehicles: nextVehicles.length }));
    }

    if (insideResult.error) {
      toast({ title: "Could not load active entries", description: insideResult.error.message, variant: "destructive" });
    } else {
      setStats((prev) => ({ ...prev, currently_inside: insideResult.count ?? 0 }));
    }

    if (todayResult.error) {
      toast({ title: "Could not load today's entries", description: todayResult.error.message, variant: "destructive" });
    } else {
      setStats((prev) => ({ ...prev, today_entries: todayResult.count ?? 0 }));
    }

    if (showLoader) setLoading(false);
  }, [toast]);

  useEffect(() => {
    void fetchAdminData(true);

    const interval = window.setInterval(() => {
      void fetchAdminData(false);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [fetchAdminData]);

  const addVehicle = async () => {
    if (!newVehicle.flat_number || !newVehicle.vehicle_number || !newVehicle.owner_name) {
      toast({ title: "Fill all required fields", variant: "destructive" });
      return;
    }

    setSavingVehicle(true);

    const qr = `RES-${newVehicle.wing}${newVehicle.flat_number}-${Date.now().toString(36).toUpperCase()}`;

    const { data, error } = await supabase
      .from("vehicles")
      .insert({
        flat_number: newVehicle.flat_number.trim(),
        wing: newVehicle.wing,
        vehicle_number: newVehicle.vehicle_number.trim().toUpperCase(),
        vehicle_type: newVehicle.vehicle_type,
        owner_name: newVehicle.owner_name.trim(),
        qr_code: qr,
      })
      .select("*")
      .single();

    setSavingVehicle(false);

    if (error) {
      toast({ title: "Vehicle registration failed", description: error.message, variant: "destructive" });
      return;
    }

    setShowQrFor(qr);
    setNewVehicle({ flat_number: "", wing: "A", vehicle_number: "", vehicle_type: "car", owner_name: "" });
    setVehicles((prev) => [data as Vehicle, ...prev]);
    setStats((prev) => ({ ...prev, total_vehicles: prev.total_vehicles + 1 }));
    await fetchAdminData(false);
    toast({ title: "Vehicle Registered", description: `QR: ${qr}` });
  };

  const allSelected = vehicles.length > 0 && selectedIds.size === vehicles.length;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(vehicles.map((v) => v.id)));
    }
  };

  const deleteSelected = async () => {
    if (selectedIds.size === 0) return;
    setDeleting(true);

    const { error } = await supabase
      .from("vehicles")
      .delete()
      .in("id", Array.from(selectedIds));

    setDeleting(false);

    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: `Deleted ${selectedIds.size} vehicle(s)` });
    setSelectedIds(new Set());
    await fetchAdminData(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
            <p className="text-muted-foreground text-sm">Committee Management • Triumph Tower CHSL</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={handleSignOut} className="touch-target text-muted-foreground hover:text-destructive">
          <Power className="h-5 w-5" />
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Registered Vehicles", value: stats.total_vehicles, icon: Car },
          { label: "Currently Inside", value: stats.currently_inside, icon: BarChart3 },
          { label: "Today's Entries", value: stats.today_entries, icon: QrCode },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4 text-center">
              <stat.icon className="h-6 w-6 text-primary mx-auto mb-1" />
              <p className="text-3xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Register Vehicle */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Plus className="h-5 w-5 text-primary" />
            Register New Vehicle
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Owner Name *</Label>
              <Input placeholder="Full name" value={newVehicle.owner_name} onChange={(e) => setNewVehicle((p) => ({ ...p, owner_name: e.target.value }))} className="touch-target" />
            </div>
            <div className="space-y-2">
              <Label>Vehicle Number *</Label>
              <Input placeholder="MH02AB1234" value={newVehicle.vehicle_number} onChange={(e) => setNewVehicle((p) => ({ ...p, vehicle_number: e.target.value.toUpperCase() }))} className="touch-target" />
            </div>
            <div className="space-y-2">
              <Label>Wing</Label>
              <Select value={newVehicle.wing} onValueChange={(v) => setNewVehicle((p) => ({ ...p, wing: v }))}>
                <SelectTrigger className="touch-target"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["A", "B", "C", "D", "E", "F", "G", "H"].map((w) => <SelectItem key={w} value={w}>Wing {w}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Flat Number *</Label>
              <Input placeholder="101" value={newVehicle.flat_number} onChange={(e) => setNewVehicle((p) => ({ ...p, flat_number: e.target.value }))} className="touch-target" />
            </div>
            <div className="space-y-2">
              <Label>Vehicle Type</Label>
              <Select value={newVehicle.vehicle_type} onValueChange={(v) => setNewVehicle((p) => ({ ...p, vehicle_type: v }))}>
                <SelectTrigger className="touch-target"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="car">Car</SelectItem>
                  <SelectItem value="bike">Bike</SelectItem>
                  <SelectItem value="scooty">Scooty</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={() => void addVehicle()} className="touch-target gap-2" disabled={savingVehicle}>
            <QrCode className="h-4 w-4" />
            {savingVehicle ? "Saving..." : "Register & Generate QR"}
          </Button>

          {showQrFor && (
            <div className="flex justify-center pt-4">
              <QrGenerator value={showQrFor} label={`Vehicle QR: ${showQrFor}`} size={250} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Upload */}
      <CsvUpload onComplete={() => { void fetchAdminData(false); }} />

      {/* Registration Requests */}
      <RegistrationRequests />

      {/* Vehicle Registry */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Vehicle Registry ({vehicles.length})</CardTitle>
            {vehicles.length > 0 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleSelectAll}
                  className="touch-target gap-1 text-xs"
                >
                  <Checkbox checked={allSelected} className="pointer-events-none" />
                  {allSelected ? "Deselect All" : "Select All"}
                </Button>
                {selectedIds.size > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => void deleteSelected()}
                    disabled={deleting}
                    className="touch-target gap-1 text-xs"
                  >
                    <Trash2 className="h-4 w-4" />
                    {deleting ? "Deleting..." : `Delete (${selectedIds.size})`}
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {vehicles.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No vehicles registered yet</p>
            ) : (
              vehicles.map((v) => (
                <div key={v.id} className="space-y-2">
                  <div className="flex items-center gap-3 justify-between p-3 rounded-lg bg-secondary/50 border border-border">
                    <Checkbox
                      checked={selectedIds.has(v.id)}
                      onCheckedChange={() => toggleSelect(v.id)}
                      className="shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-foreground">{v.vehicle_number}</p>
                      <p className="text-sm text-muted-foreground">{v.owner_name} • {v.wing}-{v.flat_number} • {v.vehicle_type}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setShowQrFor(showQrFor === v.qr_code ? null : v.qr_code)} className="touch-target gap-1">
                      <QrCode className="h-4 w-4" />
                      QR
                    </Button>
                  </div>
                  {showQrFor === v.qr_code && (
                    <div className="flex justify-center py-2">
                      <QrGenerator value={v.qr_code} label={`${v.vehicle_number} • ${v.owner_name}`} size={200} />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPanel;
