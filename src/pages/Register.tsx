import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserPlus, CheckCircle } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  guard: "Security Guard",
  resident: "Resident",
  admin: "Committee Admin",
};

interface SocietyOption {
  id: string;
  name: string;
}

const Register = () => {
  const [searchParams] = useSearchParams();
  const roleFromUrl = searchParams.get("role") || "";
  const validRole = ["guard", "resident", "admin"].includes(roleFromUrl) ? roleFromUrl : "";

  const [societies, setSocieties] = useState<SocietyOption[]>([]);
  const [form, setForm] = useState({
    email: "",
    display_name: "",
    flat_number: "",
    wing: "",
    society_id: "",
    password: "",
    confirm_password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    void supabase
      .from("societies")
      .select("id, name")
      .eq("status", "active")
      .order("name")
      .then(({ data }) => setSocieties((data ?? []) as SocietyOption[]));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.email || !form.display_name || !validRole || !form.society_id) {
      toast({ title: "Please fill all required fields, including society", variant: "destructive" });
      return;
    }

    const normalizedEmail = form.email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      toast({ title: "Please enter a valid email address", variant: "destructive" });
      return;
    }

    if (validRole === "resident" && (!form.wing || !form.flat_number.trim())) {
      toast({ title: "Wing and Flat Number are required for residents", variant: "destructive" });
      return;
    }

    if (form.password.length < 8) {
      toast({ title: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }
    if (form.password !== form.confirm_password) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.from("registration_requests").insert({
      email: normalizedEmail,
      display_name: form.display_name.trim(),
      requested_role: validRole,
      flat_number: form.flat_number.trim() || null,
      wing: form.wing || null,
      password: form.password,
      society_id: form.society_id,
    });
    setIsLoading(false);

    if (error) {
      const msg = error.message?.toLowerCase() ?? "";
      const isDuplicate = msg.includes("already registered") || msg.includes("pending registration");
      toast({
        title: isDuplicate ? "Already registered" : "Submission failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setSubmitted(true);
  };

  const showFlatFields = validRole === "resident";

  if (!validRole) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-sm text-center">
          <CardContent className="pt-8 pb-6 space-y-4">
            <p className="text-xl font-bold text-foreground">Invalid Registration Link</p>
            <p className="text-muted-foreground text-sm">
              Please use the register link from your role's login page.
            </p>
            <Button variant="outline" asChild className="mt-4">
              <Link to="/login">Back to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-sm text-center">
          <CardContent className="pt-8 pb-6 space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h2 className="text-xl font-bold text-foreground">Request Submitted!</h2>
            <p className="text-muted-foreground text-sm">
              Your registration request has been sent to the committee admin for approval.
              You will receive access once approved.
            </p>
            <Button variant="outline" asChild className="mt-4">
              <Link to="/login">Back to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto h-16 w-16 rounded-2xl flex items-center justify-center bg-primary/20 text-primary">
            <UserPlus className="h-8 w-8" />
          </div>
          <CardTitle className="text-xl">Register as {ROLE_LABELS[validRole]}</CardTitle>
          <p className="text-muted-foreground text-sm">
            Submit a registration request to your society admin
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Society *</Label>
              <Select value={form.society_id} onValueChange={(v) => setForm((p) => ({ ...p, society_id: v }))}>
                <SelectTrigger className="touch-target"><SelectValue placeholder="Select your society" /></SelectTrigger>
                <SelectContent>
                  {societies.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {societies.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No societies available.{" "}
                  <Link to="/register-society" className="text-primary hover:underline">Register a new society</Link>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input
                placeholder="Enter your full name"
                value={form.display_name}
                onChange={(e) => setForm((p) => ({ ...p, display_name: e.target.value }))}
                className="touch-target"
              />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                className="touch-target"
              />
            </div>

            {showFlatFields && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Wing *</Label>
                  <Select value={form.wing} onValueChange={(v) => setForm((p) => ({ ...p, wing: v }))}>
                    <SelectTrigger className="touch-target"><SelectValue placeholder="Wing" /></SelectTrigger>
                    <SelectContent>
                      {["A", "B", "C", "D", "E", "F", "G", "H"].map((w) => (
                        <SelectItem key={w} value={w}>Wing {w}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Flat Number *</Label>
                  <Input
                    placeholder="101"
                    value={form.flat_number}
                    onChange={(e) => setForm((p) => ({ ...p, flat_number: e.target.value }))}
                    className="touch-target"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Password *</Label>
              <Input
                type="password"
                placeholder="Min 8 characters"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                className="touch-target"
              />
            </div>
            <div className="space-y-2">
              <Label>Confirm Password *</Label>
              <Input
                type="password"
                placeholder="Re-enter password"
                value={form.confirm_password}
                onChange={(e) => setForm((p) => ({ ...p, confirm_password: e.target.value }))}
                className="touch-target"
              />
            </div>

            <Button type="submit" size="lg" className="w-full touch-target text-lg font-bold" disabled={isLoading}>
              {isLoading ? "Submitting..." : "Submit Request"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Already have access?{" "}
              <Link to="/login" className="text-primary hover:underline">Sign in</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
