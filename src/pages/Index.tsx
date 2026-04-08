import { Link } from "react-router-dom";
import { Shield, ScanLine, UserCheck, ClipboardList, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const roles = [
  {
    title: "Security Guard",
    description: "Scan vehicle stickers & manage visitor approvals",
    icon: ScanLine,
    path: "/guard",
    accent: "bg-primary/20 text-primary",
  },
  {
    title: "Visitor Entry",
    description: "Self-service registration for visitors",
    icon: UserCheck,
    path: "/visitor",
    accent: "bg-accent/20 text-accent",
  },
  {
    title: "Resident Portal",
    description: "View visit logs & generate guest passes",
    icon: ClipboardList,
    path: "/resident",
    accent: "bg-success/20 text-success",
  },
  {
    title: "Admin / Committee",
    description: "Manage vehicles, generate QR codes & view reports",
    icon: Shield,
    path: "/admin",
    accent: "bg-warning/20 text-warning",
  },
];

const Index = () => (
  <div className="min-h-screen flex items-center justify-center p-4">
    <div className="w-full max-w-lg space-y-8 text-center">
      <div className="space-y-3">
        <div className="mx-auto h-20 w-20 rounded-2xl bg-primary/20 flex items-center justify-center">
          <Car className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">
          Triumph Tower CHSL
        </h1>
        <p className="text-muted-foreground">
          QR-Powered Vehicle Management System
        </p>
      </div>

      <div className="grid gap-3">
        {roles.map((role) => (
          <Link key={role.path} to={role.path}>
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`h-12 w-12 rounded-lg flex items-center justify-center shrink-0 ${role.accent}`}>
                  <role.icon className="h-6 w-6" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-foreground">{role.title}</p>
                  <p className="text-sm text-muted-foreground">{role.description}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        © {new Date().getFullYear()} Triumph Tower CHSL
      </p>
    </div>
  </div>
);

export default Index;
