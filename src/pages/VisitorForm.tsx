import { useState } from "react";
import { Car, Send, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const VisitorForm = () => {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    vehicle_number: "",
    purpose: "",
    flat_number: "",
  });
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.vehicle_number || !form.flat_number) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    setSubmitted(true);
    toast({ title: "Request Submitted", description: "The guard will review your entry." });
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8 space-y-4">
            <CheckCircle className="h-16 w-16 text-success mx-auto" />
            <h2 className="text-2xl font-bold text-foreground">Request Submitted!</h2>
            <p className="text-muted-foreground">
              The security guard will review your entry. Please wait at the gate.
            </p>
            <Button variant="outline" onClick={() => { setSubmitted(false); setForm({ name: "", phone: "", vehicle_number: "", purpose: "", flat_number: "" }); }} className="touch-target">
              Submit Another
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center mb-2">
            <Car className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-xl">Triumph Tower CHSL</CardTitle>
          <p className="text-muted-foreground text-sm">Visitor Entry Registration</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Your Name *</Label>
              <Input id="name" placeholder="Enter your full name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="touch-target" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input id="phone" type="tel" placeholder="10-digit phone number" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} className="touch-target" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicle">Vehicle Number *</Label>
              <Input id="vehicle" placeholder="e.g. MH02AB1234" value={form.vehicle_number} onChange={(e) => setForm((p) => ({ ...p, vehicle_number: e.target.value.toUpperCase() }))} className="touch-target" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="flat">Flat Number (Wing-Flat) *</Label>
              <Input id="flat" placeholder="e.g. A-101" value={form.flat_number} onChange={(e) => setForm((p) => ({ ...p, flat_number: e.target.value }))} className="touch-target" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purpose">Purpose of Visit</Label>
              <Select onValueChange={(v) => setForm((p) => ({ ...p, purpose: v }))}>
                <SelectTrigger className="touch-target">
                  <SelectValue placeholder="Select purpose" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Guest Visit">Guest Visit</SelectItem>
                  <SelectItem value="Delivery">Delivery</SelectItem>
                  <SelectItem value="Cab/Taxi">Cab / Taxi</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" size="lg" className="w-full touch-target text-lg font-bold gap-2">
              <Send className="h-5 w-5" />
              Submit Entry Request
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default VisitorForm;
