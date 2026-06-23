import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Building2, ArrowRight, Shield, ScanLine, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

interface Society {
  id: string;
  name: string;
  slug: string;
  city: string;
  state: string;
}

const ROLES = [
  { key: "admin", label: "Society Admin", icon: Shield, description: "Manage residents, vehicles and settings" },
  { key: "guard", label: "Security Guard", icon: ScanLine, description: "Scan QR codes at the gate" },
  { key: "resident", label: "Resident", icon: Users, description: "Generate guest passes and manage vehicles" },
];

const LoginPortal = () => {
  const navigate = useNavigate();
  const [societies, setSocieties] = useState<Society[]>([]);
  const [selectedSociety, setSelectedSociety] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void supabase
      .from("societies")
      .select("id, name, slug, city, state")
      .eq("status", "active")
      .order("name")
      .then(({ data }) => {
        setSocieties((data ?? []) as Society[]);
        setLoading(false);
      });
  }, []);

  const society = societies.find((s) => s.id === selectedSociety);

  const handleContinue = () => {
    if (!society || !selectedRole) return;
    navigate(`/${society.slug}/${selectedRole}`);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <span className="font-bold text-foreground text-lg">VisitorPasses</span>
          </Link>
          <Button asChild variant="outline" size="sm">
            <Link to="/register-society">Register Society</Link>
          </Button>
        </div>
      </header>

      {/* Main */}
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center pb-2">
            <div className="h-14 w-14 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-3">
              <Building2 className="h-7 w-7 text-primary" />
            </div>
            <CardTitle className="text-2xl">Sign In</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Select your society and role to continue</p>
          </CardHeader>

          <CardContent className="space-y-5 pt-4">
            {/* Society picker */}
            <div className="space-y-2">
              <Label>Your Society</Label>
              {loading ? (
                <div className="h-10 rounded-md border border-border animate-pulse bg-secondary/40" />
              ) : societies.length === 0 ? (
                <p className="text-sm text-muted-foreground">No active societies found.</p>
              ) : (
                <Select value={selectedSociety} onValueChange={setSelectedSociety}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your society..." />
                  </SelectTrigger>
                  <SelectContent>
                    {societies.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        <span className="font-medium">{s.name}</span>
                        <span className="text-muted-foreground ml-2 text-xs">{s.city}, {s.state}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Role picker */}
            <div className="space-y-2">
              <Label>Your Role</Label>
              <div className="grid gap-2">
                {ROLES.map(({ key, label, icon: Icon, description }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedRole(key)}
                    className={`w-full text-left rounded-lg border p-3 transition-colors flex items-center gap-3
                      ${selectedRole === key
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50 hover:bg-secondary/40"
                      }`}
                  >
                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0
                      ${selectedRole === key ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-foreground">{label}</p>
                      <p className="text-xs text-muted-foreground">{description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <Button
              className="w-full gap-2"
              onClick={handleContinue}
              disabled={!selectedSociety || !selectedRole}
            >
              Continue to Login <ArrowRight className="h-4 w-4" />
            </Button>

            {society && selectedRole && (
              <p className="text-xs text-center text-muted-foreground">
                You'll be taken to{" "}
                <span className="font-mono text-foreground">visitorpasses.in/{society.slug}/{selectedRole}</span>
              </p>
            )}

            <div className="text-center pt-1">
              <p className="text-xs text-muted-foreground">
                New society?{" "}
                <Link to="/register-society" className="text-primary hover:underline">
                  Register here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPortal;
