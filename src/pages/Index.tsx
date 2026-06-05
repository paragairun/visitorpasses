import { Link } from "react-router-dom";
import { Shield, ScanLine, ClipboardList, Car, QrCode, Lock, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";

const roleCards = [
  {
    title: "Security Guard",
    description: "Log in to scan vehicle QR stickers, verify visitor passes, and manage entry & exit records in real time.",
    icon: ScanLine,
    path: "/guard",
    accent: "bg-primary/15 text-primary",
    borderHover: "hover:border-primary/50",
  },
  {
    title: "Members / Residents",
    description: "Access your portal to generate guest passes, register vehicles, and view your personal visit history.",
    icon: ClipboardList,
    path: "/resident",
    accent: "bg-success/15 text-success",
    borderHover: "hover:border-success/50",
  },
  {
    title: "Admin / Committee",
    description: "Manage the full system — approve registrations, oversee vehicle records, and generate building-wide QR codes.",
    icon: Shield,
    path: "/admin",
    accent: "bg-warning/15 text-warning",
    borderHover: "hover:border-warning/50",
  },
];

const features = [
  {
    icon: QrCode,
    title: "QR Vehicle Stickers",
    description: "Every registered vehicle gets a unique QR code for instant verification at the gate.",
  },
  {
    icon: Lock,
    title: "Secure Access Control",
    description: "Role-based authentication ensures only authorized personnel can access sensitive data.",
  },
  {
    icon: Users,
    title: "Visitor Management",
    description: "Residents can generate digital guest passes; guards scan and verify them on arrival.",
  },
];

const Index = () => (
  <div className="min-h-screen bg-background">
    {/* Hero */}
    <section className="relative overflow-hidden border-b border-border">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-3 right-3 z-10">
        <ThemeToggle />
      </div>
      <div className="relative max-w-5xl mx-auto px-4 py-16 sm:py-24 text-center">
        <div className="mx-auto h-20 w-20 rounded-2xl bg-primary/15 flex items-center justify-center mb-6">
          <Car className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground mb-4">
          GatePass Pro
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-2">
          QR-Powered Vehicle & Visitor Management System
        </p>
        <p className="text-sm text-muted-foreground/70">
          Built for Triumph Tower CHSL
        </p>
      </div>
    </section>

    {/* About / Purpose */}
    <section className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h2 className="text-2xl font-bold text-foreground mb-3">About the App</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          GatePass Pro streamlines vehicle and visitor access for gated residential communities. 
          It replaces manual logbooks with digital QR codes — letting security staff scan and verify 
          vehicles in seconds, residents generate guest passes from home, and the building committee 
          manage everything from a central admin dashboard.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-16">
        {features.map((f) => (
          <div key={f.title} className="rounded-xl border border-border bg-card p-6 text-center">
            <div className="mx-auto h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <f.icon className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
          </div>
        ))}
      </div>

      {/* Role Access Cards */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground text-center mb-8">Choose Your Portal</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {roleCards.map((role) => (
            <Link key={role.path} to={role.path} className="group">
              <Card className={`h-full transition-all duration-200 ${role.borderHover} hover:shadow-lg hover:-translate-y-1`}>
                <CardContent className="p-6 flex flex-col items-center text-center h-full">
                  <div className={`h-14 w-14 rounded-xl flex items-center justify-center mb-4 ${role.accent}`}>
                    <role.icon className="h-7 w-7" />
                  </div>
                  <p className="font-bold text-foreground text-lg mb-2">{role.title}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{role.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Visitor quick link */}
      <div className="text-center mt-6 mb-16">
        <p className="text-sm text-muted-foreground">
          Visiting someone?{" "}
          <Link to="/visitor/form" className="text-primary hover:underline font-medium">
            Fill out the visitor entry form →
          </Link>
        </p>
      </div>
    </section>

    {/* Footer */}
    <footer className="border-t border-border py-8 text-center">
      <p className="text-xs text-muted-foreground">
        © {new Date().getFullYear()} Triumph Tower CHSL — GatePass Pro
      </p>
    </footer>
  </div>
);

export default Index;
