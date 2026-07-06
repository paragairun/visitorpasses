import { Link } from "react-router-dom";
import { Building2, ArrowLeft, Clock, Shield, BarChart3, FileText, AlertTriangle, CheckCircle } from "lucide-react";

const Article = () => (
  <div className="min-h-screen bg-background">
    {/* Header */}
    <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur z-10">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <span className="font-bold text-foreground text-lg">VisitorPasses</span>
        </Link>
        <Link to="/" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>
      </div>
    </header>

    <main className="max-w-3xl mx-auto px-4 py-12 sm:py-16">

      {/* Article header */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">Society Management</span>
          <span className="text-muted-foreground text-xs">·</span>
          <span className="text-xs text-muted-foreground">8 min read</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground leading-tight mb-5">
          Why Your Housing Society Needs to Move Beyond the Paper Register
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Every gated community in India has the same scene at its entrance: a worn register, a pen tied with string,
          and a guard juggling phone calls while vehicles pile up behind him. It works — until it doesn't.
          Here is what the paper register is actually costing your society, and why going digital is simpler than you think.
        </p>
        <div className="mt-6 h-px bg-border" />
      </div>

      {/* Article body */}
      <article className="prose prose-neutral dark:prose-invert max-w-none space-y-10 text-foreground">

        {/* Section 1 */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
              <FileText className="h-5 w-5 text-destructive" />
            </div>
            <h2 className="text-xl font-bold text-foreground">The Hidden Problems with a Paper Register</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            The paper register feels harmless. It has been there since the society was built, and no one has questioned it.
            But look closer and you will find that it is one of the biggest sources of friction, risk, and wasted time in
            your society's daily operations.
          </p>
          <div className="rounded-xl border border-border bg-destructive/5 p-5 space-y-3">
            {[
              { title: "No accountability", detail: "A guard writes a vehicle number in a rush. Is it MH02 AB 1234 or MH02 AB 1243? No one knows. The register cannot tell you." },
              { title: "Zero search", detail: "When a resident reports that an unknown vehicle has been parked in their spot for three days, tracing it through hundreds of handwritten entries is a half-day job." },
              { title: "No entry/exit pairing", detail: "The same register records arrivals. But who checks that every vehicle that entered also left? The paper register has no concept of 'still inside.'" },
              { title: "Visitors bypass the guard", detail: "The guard is on a call. A vehicle waves through. There is no record. The register only captures what the guard chooses to write, when he chooses to write it." },
              { title: "No proof when something goes wrong", detail: "A theft occurs inside the premises. The police ask for entry records. You hand them a notebook with illegible handwriting and no timestamps. That is the best case scenario." },
            ].map((item) => (
              <div key={item.title} className="flex gap-3">
                <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-foreground"><span className="font-semibold">{item.title}:</span> {item.detail}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 2 */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <h2 className="text-xl font-bold text-foreground">The Real Cost: Guard Time and Resident Frustration</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            Consider what a guard does for every vehicle entry under the paper system. He stops the vehicle, asks for the
            flat number, writes the vehicle number, writes the time, calls the resident if it is a visitor, waits for
            confirmation, and waves the vehicle through. For a registered resident vehicle, this takes 60 to 90 seconds.
            For a visitor, 3 to 5 minutes including the call.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            In a society with 200 flats and two entries per flat per day on average, that is 400 manual entries every 24 hours.
            At 75 seconds each, your guard spends over 8 hours every single day just writing in the register — before he has
            done anything else his job requires.
          </p>
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
            <p className="text-sm font-semibold text-foreground mb-1">Meanwhile, the resident experience suffers too.</p>
            <p className="text-sm text-muted-foreground">
              Every resident has experienced it — the guard calling at 8 PM to verify a delivery agent, a relative waiting
              10 minutes at the gate because the guard could not reach you, or the frustration of learning that an unknown
              vehicle has been in your parking for days and no one noticed.
            </p>
          </div>
        </section>

        {/* Section 3 */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
              <Shield className="h-5 w-5 text-success" />
            </div>
            <h2 className="text-xl font-bold text-foreground">What Digital Society Management Actually Changes</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            Moving to a digital platform like VisitorPasses does not mean installing cameras, buying hardware, or training
            your guard on complex software. The transition is simpler than you think.
          </p>
          <div className="space-y-3">
            {[
              {
                title: "Vehicle entry in under 5 seconds",
                detail: "Every registered vehicle gets a unique QR sticker. The guard scans it from any smartphone browser — no app download required. The entry is logged instantly with vehicle number, flat, and timestamp.",
              },
              {
                title: "Residents control visitor access",
                detail: "Instead of calling the resident for every visitor, the resident generates a digital guest pass in 30 seconds and sends it on WhatsApp. The guard scans it at the gate. One scan. Done.",
              },
              {
                title: "Delivery agents verified before they enter",
                detail: "The guard registers a Zomato or Amazon agent at the gate — takes a photo, enters the mobile number, selects the flat. The resident gets an instant alert on their phone and taps Approve or Reject. The guard waits for the response. No phone calls.",
              },
              {
                title: "Staff and house help tracked daily",
                detail: "Maids, drivers, security guards, and facility staff each get a printed ID card with their photo and a QR code. One scan at entry, one at exit. The admin and resident can see attendance and working hours at the end of every month.",
              },
              {
                title: "A complete audit trail, forever",
                detail: "Every entry and exit is time-stamped and searchable. If something happens inside the premises, you have exact records of who entered, when, and for which flat — accessible in seconds.",
              },
            ].map((item, i) => (
              <div key={i} className="flex gap-3 p-4 rounded-lg border border-border bg-card">
                <CheckCircle className="h-5 w-5 text-success shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm text-foreground">{item.title}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 4 */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Paper vs Digital: A Direct Comparison</h2>
          </div>
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary/60">
                  <th className="text-left p-3 font-semibold text-foreground">Scenario</th>
                  <th className="text-left p-3 font-semibold text-destructive">Paper Register</th>
                  <th className="text-left p-3 font-semibold text-success">VisitorPasses</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  ["Registered vehicle entry", "Guard writes manually ~90 sec", "Guard scans QR ~5 sec"],
                  ["Visitor arrives unannounced", "Guard calls resident, waits", "Resident pre-shares a guest pass"],
                  ["Delivery agent at gate", "Guard calls resident, holds agent", "Resident approves from phone instantly"],
                  ["Finding who entered last Tuesday", "Flip through pages manually", "Search by name, vehicle, or flat in seconds"],
                  ["Monthly staff attendance", "No record exists", "Auto-generated with hours worked"],
                  ["Proof for police/legal", "Illegible handwritten notebook", "Timestamped digital log with photos"],
                  ["Guard training required", "None (write in book)", "None (scan from any browser)"],
                  ["Cost", "Register + pens ₹200/year", "Free to start, no hardware needed"],
                ].map(([scenario, paper, digital]) => (
                  <tr key={scenario} className="hover:bg-secondary/20 transition-colors">
                    <td className="p-3 font-medium text-foreground">{scenario}</td>
                    <td className="p-3 text-muted-foreground">{paper}</td>
                    <td className="p-3 text-success font-medium">{digital}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 5 */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">The Objection Everyone Has (And Why It Does Not Hold)</h2>
          <p className="text-muted-foreground leading-relaxed">
            "Our guard is not tech-savvy." This is the most common reason committees delay going digital, and it is the
            least valid one. The guard's interface on VisitorPasses is a single button: Scan QR. He opens the website on
            his phone — no app, no login on his device — points the camera at a QR code, and the entry is logged.
            That is the entire workflow. If your guard can take a WhatsApp photo, he can use this.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            "We already have a system that works." It works in the same way a paper map works when you need to drive
            somewhere — it gets you there eventually, but you are spending far more time and effort than you need to.
            The question is not whether the paper register functions. It is whether your society deserves something better.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            "Setup will be a headache." With VisitorPasses, your society can be live in under 10 minutes. Register your
            society, set up towers and wings, print one QR sticker for the gate, and give each resident their login link.
            There is no hardware to install, no vendor to call, and no IT person required.
          </p>
        </section>

        {/* Section 6 */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Security Is the Point — But Convenience Is the Reason People Switch</h2>
          <p className="text-muted-foreground leading-relaxed">
            Every committee that introduces digital visitor management does it for security. But the reason residents
            and guards actually embrace it is convenience. Residents stop getting calls from the guard every evening.
            Guards stop managing a notebook with a pen while also managing a barrier and a phone. Deliveries happen
            faster. Visitors don't wait at the gate. Maids are tracked without extra effort.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            The security benefits are real and important — a full digital audit trail, photo-verified delivery agents,
            resident-controlled guest access — but they happen quietly in the background while your society simply
            runs more smoothly every single day.
          </p>
        </section>

        {/* Conclusion / CTA */}
        <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 sm:p-8 space-y-4">
          <h2 className="text-xl font-bold text-foreground">Ready to Replace the Register?</h2>
          <p className="text-muted-foreground leading-relaxed">
            VisitorPasses is free to start. Your society gets its own dedicated URL, a complete structure builder for
            towers and wings, QR codes for vehicles, digital guest passes, staff ID cards, and a full audit log —
            all accessible from any smartphone browser, with no app to install and no hardware to buy.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            The paper register had a good run. It is time to retire it.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <a
              href="/register-society"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground font-semibold px-6 py-3 text-sm hover:bg-primary/90 transition-colors"
            >
              Register Your Society — It's Free
            </a>
            <a
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card text-foreground font-medium px-6 py-3 text-sm hover:bg-secondary/40 transition-colors"
            >
              Already registered? Sign in
            </a>
          </div>
        </div>

      </article>

      {/* Footer */}
      <div className="mt-16 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} VisitorPasses · visitorpasses.in</p>
        <div className="flex gap-4 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <Link to="/register-society" className="hover:text-foreground transition-colors">Register Society</Link>
          <Link to="/login" className="hover:text-foreground transition-colors">Sign In</Link>
        </div>
      </div>
    </main>
  </div>
);

export default Article;
