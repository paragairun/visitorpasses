import { Link } from "react-router-dom";
import {
  Shield, ScanLine, ClipboardList, Building2, QrCode, Users, ArrowRight,
  Car, Package, Wallet, Sparkles, IdCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";

const DISPLAY_FONT = "'Philosopher', serif";
const LABEL_FONT = "'Montserrat', sans-serif";

const FEATURES = [
  {
    icon: Car,
    title: "Vehicle & Visitor Management",
    description: "QR stickers for every vehicle, single-use guest passes, and instant gate verification — no logbooks.",
    tint: "bg-primary/10 text-primary",
  },
  {
    icon: IdCard,
    title: "Staff & House Help Tracking",
    description: "ID cards with QR check-in for domestic staff and society employees, with a full attendance log.",
    tint: "bg-accent/10 text-accent",
  },
  {
    icon: Package,
    title: "Delivery Management",
    description: "Delivery agents check in at the gate; residents approve or reject before anyone's let up.",
    tint: "bg-success/10 text-success",
  },
  {
    icon: Wallet,
    title: "Maintenance Billing",
    description: "Area-based dues, configurable charge heads, and full payment tracking for every flat.",
    tint: "bg-warning/10 text-warning",
    graphic: "dues",
  },
  {
    icon: Users,
    title: "Role-Based Dashboards",
    description: "Admins, guards, and residents each get their own scoped portal — nobody sees more than they need.",
    tint: "bg-primary/10 text-primary",
  },
  {
    icon: Sparkles,
    title: "Amenities",
    description: "Clubhouse, gym, and pool booking with approvals and usage limits.",
    tint: "bg-muted text-muted-foreground",
    soon: true,
  },
];

const STATS = [
  { value: "6", label: "Built-in modules" },
  { value: "3", label: "Role-based portals" },
  { value: "100%", label: "Digital record-keeping" },
  { value: "0", label: "Paper logbooks" },
];

/** Small illustrative ring graphic for the maintenance billing card -- not tied to live data. */
const DuesRing = () => (
  <svg width="56" height="56" viewBox="0 0 56 56" className="shrink-0" role="img" aria-label="Illustrative collection-rate ring, 68 percent">
    <circle cx="28" cy="28" r="24" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
    <circle
      cx="28" cy="28" r="24" fill="none" stroke="hsl(var(--warning))" strokeWidth="6"
      strokeDasharray={`${2 * Math.PI * 24 * 0.68} ${2 * Math.PI * 24}`}
      strokeLinecap="round" transform="rotate(-90 28 28)"
    />
    <text x="28" y="32" textAnchor="middle" fontSize="13" fontWeight="600" fill="hsl(var(--foreground))">68%</text>
  </svg>
);

/** Mini browser-frame mockup of the actual resident Home dashboard, used as the hero visual. */
const HeroMockup = () => (
  <div className="rounded-2xl border border-border bg-card shadow-xl overflow-hidden max-w-sm mx-auto lg:mx-0">
    <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border bg-secondary/50">
      <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
      <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
      <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
      <span className="ml-2 text-[10px] text-muted-foreground truncate" style={{ fontFamily: LABEL_FONT }}>
        visitorpasses.in/triumph-towers-chsl
      </span>
    </div>
    <div className="p-4 space-y-3">
      <div>
        <p className="text-sm font-semibold text-foreground">Good morning, Rahul</p>
        <p className="text-xs text-muted-foreground">Shree Laxmi CHSL · A-101</p>
      </div>
      <div className="rounded-lg border-l-4 border-l-primary bg-secondary/40 p-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] text-muted-foreground">Outstanding dues</p>
          <p className="text-lg font-bold text-foreground">₹4,250</p>
        </div>
        <ArrowRight className="h-4 w-4 text-primary" />
      </div>
      <div className="grid grid-cols-4 gap-2">
        {[
          { icon: QrCode, tint: "bg-primary/10 text-primary" },
          { icon: Car, tint: "bg-accent/10 text-accent" },
          { icon: Package, tint: "bg-success/10 text-success" },
          { icon: Users, tint: "bg-warning/10 text-warning" },
        ].map((t, i) => (
          <div key={i} className="flex flex-col items-center gap-1 p-2 rounded-lg border border-border">
            <span className={`h-7 w-7 rounded-full flex items-center justify-center ${t.tint}`}>
              <t.icon className="h-3.5 w-3.5" />
            </span>
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-border p-3 space-y-2">
        <p className="text-[10px] text-muted-foreground" style={{ fontFamily: LABEL_FONT }}>RECENT ACTIVITY</p>
        <div className="flex items-center gap-2">
          <span className="h-5 w-5 rounded-full bg-success/10 text-success flex items-center justify-center text-[10px]">→</span>
          <div className="h-1.5 flex-1 rounded-full bg-secondary" />
        </div>
        <div className="flex items-center gap-2">
          <span className="h-5 w-5 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-[10px]">←</span>
          <div className="h-1.5 flex-1 rounded-full bg-secondary" />
        </div>
      </div>
    </div>
  </div>
);

const Index = () => (
  <div className="min-h-screen bg-background">
    {/* Top bar */}
    <header className="border-b border-border">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <span className="font-bold text-foreground text-lg" style={{ fontFamily: DISPLAY_FONT }}>VisitorPasses</span>
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
      <div className="relative max-w-6xl mx-auto px-4 py-16 sm:py-24 grid lg:grid-cols-2 gap-12 items-center">
        <div className="text-center lg:text-left">
          <p className="text-xs font-semibold tracking-widest text-primary uppercase mb-3" style={{ fontFamily: LABEL_FONT }}>
            Complete Society Management
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground mb-5" style={{ fontFamily: DISPLAY_FONT }}>
            Everything your society runs on. One platform.
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-8">
            Vehicles, visitors, staff, deliveries, and maintenance dues — replace scattered logbooks and
            spreadsheets with one QR-powered platform built for Indian housing societies.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
            <Button asChild size="lg" className="text-base font-bold gap-2">
              <Link to="/register-society">Register Your Society <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-base">
              <Link to="/login">I already have an account</Link>
            </Button>
          </div>
        </div>
        <HeroMockup />
      </div>
    </section>

    {/* Stats band */}
    <section className="border-b border-border bg-secondary/30">
      <div className="max-w-5xl mx-auto px-4 py-10 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
        {STATS.map((s) => (
          <div key={s.label}>
            <p className="text-3xl sm:text-4xl font-bold text-foreground" style={{ fontFamily: DISPLAY_FONT }}>{s.value}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mt-1" style={{ fontFamily: LABEL_FONT }}>{s.label}</p>
          </div>
        ))}
      </div>
    </section>

    {/* Features */}
    <section className="max-w-6xl mx-auto px-4 py-16">
      <h2 className="text-3xl font-bold text-foreground text-center mb-3" style={{ fontFamily: DISPLAY_FONT }}>
        Everything your society needs
      </h2>
      <p className="text-muted-foreground text-center max-w-xl mx-auto mb-12">
        Each society gets its own isolated portal — separate residents, guards, admins, and data.
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {FEATURES.map((f) => (
          <div key={f.title} className={`relative rounded-xl border p-6 ${f.soon ? "border-dashed border-border bg-muted/20" : "border-border bg-card"}`}>
            {f.soon && (
              <span className="absolute top-4 right-4 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border" style={{ fontFamily: LABEL_FONT }}>
                COMING SOON
              </span>
            )}
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${f.tint}`}>
                <f.icon className="h-6 w-6" />
              </div>
              {f.graphic === "dues" && <DuesRing />}
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
        <h2 className="text-3xl font-bold text-foreground text-center mb-12" style={{ fontFamily: DISPLAY_FONT }}>
          How it works
        </h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            { n: 1, t: "Register your society", d: "Submit your society details — name, address, and admin contact." },
            { n: 2, t: "Get approved", d: "Our platform team reviews and activates your society within hours." },
            { n: 3, t: "Onboard everyone", d: "Add guards, invite residents, register vehicles and staff, and set up dues." },
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
      <h2 className="text-3xl font-bold text-foreground text-center mb-12" style={{ fontFamily: DISPLAY_FONT }}>
        Choose your portal
      </h2>
      <div className="grid sm:grid-cols-3 gap-4">
        <Link to="/login" className="group">
          <Card className="h-full transition-all hover:border-warning/50 hover:shadow-lg hover:-translate-y-1">
            <CardContent className="p-6 text-center">
              <div className="mx-auto h-14 w-14 rounded-xl bg-warning/15 text-warning flex items-center justify-center mb-4">
                <Shield className="h-7 w-7" />
              </div>
              <p className="font-bold text-foreground text-lg mb-2">Admin / Committee</p>
              <p className="text-sm text-muted-foreground">Manage residents, vehicles, staff, and maintenance billing.</p>
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
              <p className="text-sm text-muted-foreground">Scan QRs for vehicles, guests, staff, and deliveries.</p>
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
              <p className="text-sm text-muted-foreground">Guest passes, dues, deliveries, and visit history — all in one place.</p>
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

<section className="max-w-5xl mx-auto px-4 py-16">
  <h2 className="text-2xl font-bold text-foreground mb-2">From the desk of VisitorPasses</h2>
  <p className="text-muted-foreground mb-8">Practical insights on society management and security.</p>
  <Link to="/article/digital-vs-paper-society-management" className="group block rounded-2xl border border-border bg-card hover:border-primary/40 transition-colors p-6 sm:p-8">
    <div className="flex items-start gap-4">
      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
        <FileText className="h-6 w-6 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">Society Management</p>
        <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors leading-snug mb-2">
          Why Your Housing Society Needs to Move Beyond the Paper Register
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          What the paper register is actually costing your society in time, safety, and resident frustration —
          and why going digital is simpler than you think.
        </p>
        <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
          Read article <ArrowRight className="h-3 w-3" />
        </p>
      </div>
    </div>
  </Link>
</section>
    
    <footer className="border-t border-border py-8 text-center">
      <p className="text-xs text-muted-foreground">
        © {new Date().getFullYear()} VisitorPasses — Complete society management
      </p>
    </footer>
  </div>
);

export default Index;
