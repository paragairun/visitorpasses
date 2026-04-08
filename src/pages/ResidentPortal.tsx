import { useState } from "react";
import { ClipboardList, Share2, QrCode, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import StatusBadge from "@/components/StatusBadge";
import QrGenerator from "@/components/QrGenerator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import StatusBadge from "@/components/StatusBadge";
import QrGenerator from "@/components/QrGenerator";
import { useToast } from "@/hooks/use-toast";

interface GuestPass {
  id: string;
  guest_name: string;
  code: string;
  created_at: string;
}

const mockVisitLogs = [
  { id: "1", visitor_name: "Vikram Singh", vehicle_number: "MH04XY7890", purpose: "Delivery", time: "Today 10:30 AM", status: "approved" as const },
  { id: "2", visitor_name: "Meera Joshi", vehicle_number: "MH01ZZ1234", purpose: "Guest Visit", time: "Yesterday 3:15 PM", status: "approved" as const },
  { id: "3", visitor_name: "Ravi Taxi", vehicle_number: "MH02TT9999", purpose: "Cab/Taxi", time: "Yesterday 9:00 AM", status: "exited" as const },
];

const ResidentPortal = () => {
  const [guestName, setGuestName] = useState("");
  const [guestPasses, setGuestPasses] = useState<GuestPass[]>([]);
  const [showQr, setShowQr] = useState<string | null>(null);
  const { toast } = useToast();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/resident", { replace: true });
  };

  const generateGuestPass = () => {
    if (!guestName.trim()) {
      toast({ title: "Enter guest name", variant: "destructive" });
      return;
    }
    const code = `GUEST-${Date.now().toString(36).toUpperCase()}`;
    const pass: GuestPass = { id: Date.now().toString(), guest_name: guestName, code, created_at: new Date().toISOString() };
    setGuestPasses((prev) => [pass, ...prev]);
    setGuestName("");
    setShowQr(code);
    toast({ title: "Guest Pass Created!", description: code });
  };

  const sharePass = (pass: GuestPass) => {
    const url = `${window.location.origin}/visitor?guest_pass=${pass.code}`;
    const text = `Hi ${pass.guest_name}, here's your guest pass for Triumph Tower: ${url}`;
    if (navigator.share) {
      navigator.share({ title: "Triumph Tower Guest Pass", text, url });
    } else {
      navigator.clipboard.writeText(text);
      toast({ title: "Link copied to clipboard!" });
    }
  };

  return (
    <div className="min-h-screen p-4 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Resident Portal</h1>
          <p className="text-muted-foreground text-sm">A-101 • Rajesh Sharma</p>
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
          <div className="flex gap-3">
            <div className="flex-1 space-y-2">
              <Label htmlFor="guest-name">Guest Name</Label>
              <Input id="guest-name" placeholder="Enter guest's name" value={guestName} onChange={(e) => setGuestName(e.target.value)} className="touch-target" />
            </div>
            <Button onClick={generateGuestPass} className="self-end touch-target gap-2">
              <QrCode className="h-4 w-4" />
              Generate
            </Button>
          </div>

          {showQr && (
            <div className="flex justify-center">
              <QrGenerator value={showQr} label={`Guest Pass: ${showQr}`} />
            </div>
          )}

          {guestPasses.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Recent Passes</p>
              {guestPasses.map((pass) => (
                <div key={pass.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
                  <div>
                    <p className="font-medium text-foreground">{pass.guest_name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{pass.code}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => sharePass(pass)} className="touch-target gap-1">
                    <Share2 className="h-4 w-4" />
                    Share
                  </Button>
                </div>
              ))}
            </div>
          )}
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
          {mockVisitLogs.map((log) => (
            <div key={log.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-foreground">{log.visitor_name}</p>
                  <StatusBadge status={log.status} />
                </div>
                <p className="text-sm text-muted-foreground">{log.vehicle_number} • {log.purpose} • {log.time}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResidentPortal;
