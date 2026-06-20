import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useSocietyStructure } from "@/hooks/useSocietyStructure";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface SearchResult {
  type: "resident" | "guest";
  wing: string;
  flat_number: string;
  vehicle_number: string;
}

const normalize = (v: string) =>
  v.toUpperCase().replace(/[^A-Z0-9]/g, "");

const VehicleSearch = () => {
  const { societyId } = useAuth();
  const { formatFlat } = useSocietyStructure(societyId);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    const norm = normalize(query);
    if (!norm) return;

    setSearching(true);
    setResults(null);

    const [vehiclesRes, visitorsRes] = await Promise.all([
      supabase.from("vehicles").select("wing, flat_number, vehicle_number"),
      supabase.from("visitor_requests").select("flat_number, vehicle_number, status"),
    ]);

    const matches: SearchResult[] = [];

    (vehiclesRes.data ?? []).forEach((v) => {
      if (normalize(v.vehicle_number).includes(norm)) {
        matches.push({ type: "resident", wing: v.wing, flat_number: v.flat_number, vehicle_number: v.vehicle_number });
      }
    });

    (visitorsRes.data ?? [])
      .filter((v) => v.status !== "rejected")
      .forEach((v) => {
        if (normalize(v.vehicle_number).includes(norm)) {
          const parts = v.flat_number.includes("-") ? v.flat_number.split("-") : ["", v.flat_number];
          matches.push({ type: "guest", wing: parts[0], flat_number: parts.slice(1).join("-") || parts[0], vehicle_number: v.vehicle_number });
        }
      });

    setResults(matches);
    setSearching(false);
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <form
          onSubmit={(e) => { e.preventDefault(); void handleSearch(); }}
          className="flex gap-2"
        >
          <Input
            placeholder="Search vehicle number (partial allowed)…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={searching || !query.trim()}>
            <Search className="h-4 w-4" />
          </Button>
        </form>

        {results !== null && (
          results.length === 0 ? (
            <p className="text-muted-foreground text-center text-sm py-2">No vehicle found</p>
          ) : (
            results.map((r, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
                <div>
                  <p className="font-bold text-foreground">{r.vehicle_number}</p>
                  <p className="text-xs text-muted-foreground">{formatFlat(r.wing, r.flat_number)}</p>
                </div>
                <Badge variant={r.type === "resident" ? "default" : "secondary"}>
                  {r.type === "resident" ? "Resident" : "Guest"}
                </Badge>
              </div>
            ))
          )
        )}
      </CardContent>
    </Card>
  );
};

export default VehicleSearch;
