import { Link } from "react-router-dom";
import { Shield, ScanLine, ClipboardList, Building2, QrCode, Lock, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";

const features = [
  {
    icon: QrCode,
    title: "QR Vehicle Stickers",
    description: "Every registered vehicle gets a unique QR code for instant gate verification.",
  },
  {
    icon: Lock,
    title: "Role-Based Access",
    description: "Admins, guards, and residents each get their own scoped dashboard.",
  },
  {
    icon: Users,
    title: "Digital Guest Passes",
    description: "Residents generate single-use QR passes; guards scan them on arrival.",
  },
];

const Index = () => (
  <div className="min-h-screen bg-background">
    {/* Top bar */}
    <header className="border-b border-border">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <span className="font-bold text-foreground text-lg">GatePass Pro</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild variant="outline" size="sm">
            <Link to="/login">Login</Link>
          </Button>
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link to="/register-society">Register Society</Link>
          </Button>
        </div>
      </div>
    </header>

    {/* Hero */}
    <section className="relative overflow-hidden border-b border-border">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none" />
      <div className="relative max-w-5xl mx-auto px-4 py-20 sm:py-28 text-center">
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground mb-5">
          Modern Vehicle &amp; Visitor<br />Management for Your Society
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Replace manual logbooks with QR-powered access control. One platform for your whole society —
          admins, guards, and residents.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg" className="text-base font-bold gap-2">
            <Link to="/register-society">Register Your Society <ArrowRight className="h-4 w-4" /></Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="text-base">
            <Link to="/login">I already have an account</Link>
          </Button>
        </div>
      </div>
    </section>

    {/* Features */}
    <section className="max-w-5xl mx-auto px-4 py-16">
      <h2 className="text-3xl font-bold text-foreground text-center mb-3">Everything your society needs</h2>
      <p className="text-muted-foreground text-center max-w-xl mx-auto mb-12">
        Each society on GatePass Pro gets its own isolated portal with separate residents, guards, and admins.
      </p>
      <div className="grid sm:grid-cols-3 gap-4">
        {features.map((f) => (
          <div key={f.title} className="rounded-xl border border-border bg-card p-6">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <f.icon className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
          </div>
        ))}
      </div>
    </section>

    {/* How it works */}
    <section className="border-t border-border bg-secondary/30">
      <div className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-foreground text-center mb-12">How it works</h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            { n: 1, t: "Register your society", d: "Submit your society details — name, address, and admin contact." },
            { n: 2, t: "Get approved", d: "Our platform team reviews and activates your society within hours." },
            { n: 3, t: "Onboard everyone", d: "Add guards, invite residents, register vehicles, and start scanning." },
          ].map((s) => (
            <div key={s.n} className="text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center mb-3">
                {s.n}
              </div>
              <h3 className="font-semibold text-foreground mb-2">{s.t}</h3>
              <p className="text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Role portals */}
    <section className="max-w-5xl mx-auto px-4 py-16">
      <h2 className="text-3xl font-bold text-foreground text-center mb-12">Choose your portal</h2>
      <div className="grid sm:grid-cols-3 gap-4">
        <Link to="/login" className="group">
          <Card className="h-full transition-all hover:border-warning/50 hover:shadow-lg hover:-translate-y-1">
            <CardContent className="p-6 text-center">
              <div className="mx-auto h-14 w-14 rounded-xl bg-warning/15 text-warning flex items-center justify-center mb-4">
                <Shield className="h-7 w-7" />
              </div>
              <p className="font-bold text-foreground text-lg mb-2">Admin / Committee</p>
              <p className="text-sm text-muted-foreground">Manage residents, vehicles, and approvals for your society.</p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/login" className="group">
          <Card className="h-full transition-all hover:border-primary/50 hover:shadow-lg hover:-translate-y-1">
            <CardContent className="p-6 text-center">
              <div className="mx-auto h-14 w-14 rounded-xl bg-primary/15 text-primary flex items-center justify-center mb-4">
                <ScanLine className="h-7 w-7" />
              </div>
              <p className="font-bold text-foreground text-lg mb-2">Security Guard</p>
              <p className="text-sm text-muted-foreground">Scan vehicle &amp; guest QRs and log entries in real time.</p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/login" className="group">
          <Card className="h-full transition-all hover:border-success/50 hover:shadow-lg hover:-translate-y-1">
            <CardContent className="p-6 text-center">
              <div className="mx-auto h-14 w-14 rounded-xl bg-success/15 text-success flex items-center justify-center mb-4">
                <ClipboardList className="h-7 w-7" />
              </div>
              <p className="font-bold text-foreground text-lg mb-2">Residents</p>
              <p className="text-sm text-muted-foreground">Generate guest passes and track your visit history.</p>
            </CardContent>
          </Card>
        </Link>
      </div>
      <div className="text-center mt-10">
        <Link to="/super-admin" className="text-xs text-muted-foreground hover:text-foreground">
          Platform admin →
        </Link>
      </div>
    </section>

    <footer className="border-t border-border py-8 text-center">
      <p className="text-xs text-muted-foreground">
        © {new Date().getFullYear()} GatePass Pro — Multi-society access management
      </p>
    </footer>
  </div>
);

export default Index;
