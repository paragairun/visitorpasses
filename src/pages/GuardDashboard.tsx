import { useState } from "react";
import { ScanLine, Check, X, LogOut, Car, Bike } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StatusBadge from "@/components/StatusBadge";
import QrScanner from "@/components/QrScanner";
import { mockVehicles, mockVisitorRequests, mockEntryLogs } from "@/lib/mock-data";
import type { VisitorRequest, EntryLog } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";

const GuardDashboard = () => {
  const [scanning, setScanning] = useState(false);
  const [visitors, setVisitors] = useState<VisitorRequest[]>(mockVisitorRequests);
  const [liveVehicles, setLiveVehicles] = useState<EntryLog[]>(mockEntryLogs);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const { toast } = useToast();

  const handleScan = (result: string) => {
    setScanning(false);
    const vehicle = mockVehicles.find((v) => v.qr_code === result);
    if (vehicle) {
      setScanResult(`✅ ${vehicle.owner_name} — ${vehicle.wing}-${vehicle.flat_number} — ${vehicle.vehicle_number}`);
      setLiveVehicles((prev) => [
        {
          id: Date.now().toString(),
          vehicle_number: vehicle.vehicle_number,
          flat_number: vehicle.flat_number,
          wing: vehicle.wing,
          entry_type: "resident",
          entry_time: new Date().toISOString(),
          exit_time: null,
          owner_name: vehicle.owner_name,
        },
        ...prev,
      ]);
      toast({ title: "Entry Logged", description: `${vehicle.owner_name} — ${vehicle.vehicle_number}` });
    } else {
      setScanResult("❌ Unknown QR code. Vehicle not registered.");
      toast({ title: "Unknown Vehicle", description: "QR code not found in registry.", variant: "destructive" });
    }
    setTimeout(() => setScanResult(null), 5000);
  };

  const handleApprove = (id: string) => {
    const visitor = visitors.find((v) => v.id === id);
    setVisitors((prev) => prev.map((v) => (v.id === id ? { ...v, status: "approved" as const } : v)));
    if (visitor) {
      setLiveVehicles((prev) => [
        {
          id: Date.now().toString(),
          vehicle_number: visitor.vehicle_number,
          flat_number: visitor.flat_number,
          wing: "",
          entry_type: "visitor",
          entry_time: new Date().toISOString(),
          exit_time: null,
          owner_name: `${visitor.visitor_name} (Visitor)`,
        },
        ...prev,
      ]);
    }
    toast({ title: "Visitor Approved", description: visitor?.visitor_name });
  };

  const handleReject = (id: string) => {
    setVisitors((prev) => prev.map((v) => (v.id === id ? { ...v, status: "rejected" as const } : v)));
    toast({ title: "Visitor Rejected", variant: "destructive" });
  };

  const handleCheckout = (id: string) => {
    setLiveVehicles((prev) => prev.filter((v) => v.id !== id));
    toast({ title: "Vehicle Checked Out" });
  };

  const pendingVisitors = visitors.filter((v) => v.status === "pending");

  return (
    <div className="min-h-screen p-4 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Guard Dashboard</h1>
          <p className="text-muted-foreground text-sm">Triumph Tower CHSL</p>
        </div>
        <Button
          size="lg"
          onClick={() => setScanning(true)}
          className="touch-target gap-2 text-lg font-bold animate-pulse-glow"
        >
          <ScanLine className="h-6 w-6" />
          Scan Sticker
        </Button>
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
                  <Button size="icon" onClick={() => handleApprove(visitor.id)} className="touch-target bg-success hover:bg-success/80">
                    <Check className="h-5 w-5" />
                  </Button>
                  <Button size="icon" variant="destructive" onClick={() => handleReject(visitor.id)} className="touch-target">
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
          {liveVehicles.map((entry) => (
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
              <Button variant="outline" size="sm" onClick={() => handleCheckout(entry.id)} className="touch-target gap-1 border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground">
                <LogOut className="h-4 w-4" />
                Out
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {scanning && <QrScanner onScan={handleScan} onClose={() => setScanning(false)} />}
    </div>
  );
};

export default GuardDashboard;
