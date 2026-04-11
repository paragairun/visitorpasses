import { useState } from "react";
import { Plus, QrCode, Car, BarChart3, Shield, Power } from "lucide-react";
import RegistrationRequests from "@/components/RegistrationRequests";
import CsvUpload from "@/components/CsvUpload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import QrGenerator from "@/components/QrGenerator";
import { mockVehicles, mockEntryLogs } from "@/lib/mock-data";
import type { Vehicle } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const AdminPanel = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>(mockVehicles);
  const [showQrFor, setShowQrFor] = useState<string | null>(null);
  const [newVehicle, setNewVehicle] = useState({ flat_number: "", wing: "A", vehicle_number: "", vehicle_type: "car", owner_name: "" });
  const { toast } = useToast();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const handleSignOut = async () => { await signOut(); navigate("/admin", { replace: true }); };

  const addVehicle = () => {
    if (!newVehicle.flat_number || !newVehicle.vehicle_number || !newVehicle.owner_name) {
      toast({ title: "Fill all required fields", variant: "destructive" });
      return;
    }
    const qr = `RES-${newVehicle.wing}${newVehicle.flat_number}-${Date.now().toString(36).toUpperCase()}`;
    const vehicle: Vehicle = {
      id: Date.now().toString(),
      ...newVehicle,
      vehicle_type: newVehicle.vehicle_type as Vehicle["vehicle_type"],
      qr_code: qr,
    };
    setVehicles((prev) => [vehicle, ...prev]);
    setShowQrFor(qr);
    setNewVehicle({ flat_number: "", wing: "A", vehicle_number: "", vehicle_type: "car", owner_name: "" });
    toast({ title: "Vehicle Registered", description: `QR: ${qr}` });
  };

  const stats = {
    total_vehicles: vehicles.length,
    currently_inside: mockEntryLogs.filter((l) => !l.exit_time).length,
    today_entries: mockEntryLogs.length,
  };

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
                  {["A", "B", "C", "D"].map((w) => <SelectItem key={w} value={w}>Wing {w}</SelectItem>)}
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
          <Button onClick={addVehicle} className="touch-target gap-2">
            <QrCode className="h-4 w-4" />
            Register & Generate QR
          </Button>

          {showQrFor && (
            <div className="flex justify-center pt-4">
              <QrGenerator value={showQrFor} label={`Vehicle QR: ${showQrFor}`} size={250} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Upload */}
      <CsvUpload onComplete={() => {/* TODO: refetch from DB */}} />

      {/* Registration Requests */}
      <RegistrationRequests />

      {/* Vehicle Registry */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Vehicle Registry ({vehicles.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {vehicles.map((v) => (
              <div key={v.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
                <div>
                  <p className="font-bold text-foreground">{v.vehicle_number}</p>
                  <p className="text-sm text-muted-foreground">{v.owner_name} • {v.wing}-{v.flat_number} • {v.vehicle_type}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowQrFor(showQrFor === v.qr_code ? null : v.qr_code)} className="touch-target gap-1">
                  <QrCode className="h-4 w-4" />
                  QR
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPanel;
