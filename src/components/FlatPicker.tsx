import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSocietyStructure } from "@/hooks/useSocietyStructure";

interface FlatPickerProps {
  societyId: string | null | undefined;
  wing: string;
  flatNumber: string;
  onChange: (wing: string, flatNumber: string) => void;
  disabled?: boolean;
}

/**
 * Lets the user pick a Tower -> Wing -> Flat number, using the society's
 * configured structure (towers/wings/flat ranges) when available.
 * Falls back to free-text Wing + Flat Number inputs for societies that
 * haven't had a structure configured (e.g. legacy societies).
 */
const FlatPicker = ({ societyId, wing, flatNumber, onChange, disabled }: FlatPickerProps) => {
  const { structure, loading, hasStructure, flatsForWing } = useSocietyStructure(societyId);

  // Track the selected tower locally so the Wing dropdown can be scoped to it.
  const towerForWing = (w: string) => structure.find((t) => t.wings.some((x) => x.wing === w))?.tower_name;
  const [selectedTower, setSelectedTower] = useState<string | undefined>(() => towerForWing(wing));

  useEffect(() => {
    setSelectedTower(towerForWing(wing));
    // Only re-sync when the external wing value changes (e.g. switching residents/vehicles)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wing, structure]);

  const wingsInTower = useMemo(
    () => structure.find((t) => t.tower_name === selectedTower)?.wings.map((w) => w.wing) ?? [],
    [structure, selectedTower],
  );

  const flatOptions = useMemo(() => (wing ? flatsForWing(wing) : []), [wing, flatsForWing]);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading flat list...</p>;
  }

  if (!hasStructure) {
    // Legacy fallback: free-text wing + flat number
    return (
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Wing</Label>
          <Input
            value={wing}
            onChange={(e) => onChange(e.target.value.toUpperCase(), flatNumber)}
            placeholder="A"
            disabled={disabled}
          />
        </div>
        <div className="space-y-2">
          <Label>Flat Number</Label>
          <Input
            value={flatNumber}
            onChange={(e) => onChange(wing, e.target.value.toUpperCase())}
            placeholder="1201"
            disabled={disabled}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="space-y-2">
        <Label>Tower / Building</Label>
        <Select
          value={selectedTower ?? ""}
          onValueChange={(t) => {
            setSelectedTower(t);
            onChange("", ""); // reset wing/flat when tower changes
          }}
          disabled={disabled}
        >
          <SelectTrigger className="touch-target"><SelectValue placeholder="Select tower" /></SelectTrigger>
          <SelectContent>
            {structure.map((t) => (
              <SelectItem key={t.tower_name} value={t.tower_name}>{t.tower_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Wing</Label>
        <Select
          value={wing}
          onValueChange={(w) => onChange(w, "")}
          disabled={disabled || !selectedTower}
        >
          <SelectTrigger className="touch-target"><SelectValue placeholder="Select wing" /></SelectTrigger>
          <SelectContent>
            {wingsInTower.map((w) => (
              <SelectItem key={w} value={w}>Wing {w}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Flat Number</Label>
        <Select
          value={flatNumber}
          onValueChange={(f) => onChange(wing, f)}
          disabled={disabled || !wing}
        >
          <SelectTrigger className="touch-target"><SelectValue placeholder="Select flat" /></SelectTrigger>
          <SelectContent>
            {flatOptions.map((f) => (
              <SelectItem key={f} value={f}>{f}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default FlatPicker;
