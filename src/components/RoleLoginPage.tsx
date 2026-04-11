import { useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { LucideIcon } from "lucide-react";

interface RoleLoginPageProps {
  roleName: string;
  roleKey: "guard" | "resident" | "admin" | "visitor";
  icon: LucideIcon;
  accentClass: string;
  dashboardPath: string;
  description: string;
}

const RoleLoginPage = ({ roleName, roleKey, icon: Icon, accentClass, dashboardPath, description }: RoleLoginPageProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, user, role } = useAuth();
  const { toast } = useToast();

  // If already logged in with the correct role, go to dashboard
  if (user && role === roleKey) {
    return <Navigate to={dashboardPath} replace />;
  }

  // If logged in but wrong role, show access denied
  if (user && role && role !== roleKey) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 text-center">
        <div className="space-y-4">
          <p className="text-2xl font-bold text-destructive">Access Denied</p>
          <p className="text-muted-foreground">
            Your account has the <strong>{role}</strong> role. This page is for <strong>{roleKey}</strong> users only.
          </p>
          <Button variant="outline" onClick={() => { void signOut(); }}>Sign Out</Button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({ title: "Enter email and password", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    const { error } = await signIn(email, password);
    setIsLoading(false);

    if (error) {
      toast({ title: "Login Failed", description: error, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center space-y-3">
          <div className={`mx-auto h-16 w-16 rounded-2xl flex items-center justify-center ${accentClass}`}>
            <Icon className="h-8 w-8" />
          </div>
          <CardTitle className="text-xl">{roleName}</CardTitle>
          <p className="text-muted-foreground text-sm">{description}</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="touch-target"
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="touch-target"
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" size="lg" className="w-full touch-target text-lg font-bold" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Don't have access?{" "}
              <Link to="/register" className="text-primary hover:underline">Register here</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default RoleLoginPage;
