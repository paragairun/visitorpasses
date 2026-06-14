import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface WingStructure {
  wing: string;
  flat_from: string;
  flat_to: string;
}

export interface TowerStructure {
  tower_name: string;
  wings: WingStructure[];
}

export interface NormalizedWing {
  wing: string;
  flat_from: number;
  flat_to: number;
}

export interface NormalizedTower {
  tower_name: string;
  wings: NormalizedWing[];
}

export const emptyWing = (): WingStructure => ({ wing: "", flat_from: "", flat_to: "" });
export const emptyTower = (): TowerStructure => ({ tower_name: "", wings: [emptyWing()] });

/** Convert normalized (numbers) structure from the DB into editable string-based form state. */
export const toEditableTowers = (towers: NormalizedTower[]): TowerStructure[] => {
  if (!towers || towers.length === 0) return [emptyTower()];
  return towers.map((t) => ({
    tower_name: t.tower_name,
    wings: t.wings.length > 0
      ? t.wings.map((w) => ({ wing: w.wing, flat_from: String(w.flat_from), flat_to: String(w.flat_to) }))
      : [emptyWing()],
  }));
};

/**
 * Validate + normalize editable towers into the DB-ready shape.
 * Returns either the normalized structure or an error message to show via toast.
 */
export const normalizeTowers = (towers: TowerStructure[]): { towers: NormalizedTower[] } | { error: string } => {
  const normalizedTowers: NormalizedTower[] = [];
  for (const tower of towers) {
    const towerName = tower.tower_name.trim();
    if (!towerName && tower.wings.every((w) => !w.wing.trim() && !w.flat_from.trim() && !w.flat_to.trim())) {
      continue;
    }
    if (!towerName) {
      return { error: "Enter a name for every tower/building" };
    }
    const wings: NormalizedWing[] = [];
    for (const w of tower.wings) {
      const wingName = w.wing.trim().toUpperCase();
      if (!wingName && !w.flat_from.trim() && !w.flat_to.trim()) continue;
      if (!wingName) {
        return { error: `Enter a wing name for ${towerName}` };
      }
      const from = Number(w.flat_from);
      const to = Number(w.flat_to);
      if (!w.flat_from.trim() || !w.flat_to.trim() || !Number.isFinite(from) || !Number.isFinite(to) || from <= 0 || to <= 0) {
        return { error: `Enter a valid flat number range for ${towerName} - Wing ${wingName}` };
      }
      if (from > to) {
        return { error: `Flat range start must be \u2264 end for ${towerName} - Wing ${wingName}` };
      }
      wings.push({ wing: wingName, flat_from: from, flat_to: to });
    }
    if (wings.length === 0) {
      return { error: `Add at least one wing for ${towerName}` };
    }
    normalizedTowers.push({ tower_name: towerName, wings });
  }
  return { towers: normalizedTowers };
};

interface SocietyStructureBuilderProps {
  towers: TowerStructure[];
  onChange: (towers: TowerStructure[]) => void;
  /** Disable all inputs (e.g. while saving) */
  disabled?: boolean;
}

/**
 * Editable list of towers/buildings, each with wings and a flat-number range per wing.
 * Pure, controlled component - parent owns the `towers` state.
 */
const SocietyStructureBuilder = ({ towers, onChange, disabled }: SocietyStructureBuilderProps) => {
  const addTower = () => onChange([...towers, emptyTower()]);
  const removeTower = (ti: number) => onChange(towers.filter((_, i) => i !== ti));
  const updateTowerName = (ti: number, name: string) =>
    onChange(towers.map((t, i) => (i === ti ? { ...t, tower_name: name } : t)));

  const addWing = (ti: number) =>
    onChange(towers.map((t, i) => (i === ti ? { ...t, wings: [...t.wings, emptyWing()] } : t)));
  const removeWing = (ti: number, wi: number) =>
    onChange(towers.map((t, i) => (i === ti ? { ...t, wings: t.wings.filter((_, j) => j !== wi) } : t)));
  const updateWing = (ti: number, wi: number, field: keyof WingStructure, value: string) =>
    onChange(towers.map((t, i) => {
      if (i !== ti) return t;
      return { ...t, wings: t.wings.map((w, j) => (j === wi ? { ...w, [field]: value } : w)) };
    }));

  return (
    <div className="space-y-3">
      {towers.map((tower, ti) => (
        <div key={ti} className="rounded-lg border border-border p-3 space-y-3">
          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-2">
              <Label>Building / Tower name *</Label>
              <Input
                value={tower.tower_name}
                onChange={(e) => updateTowerName(ti, e.target.value)}
                placeholder="e.g. Tower 1 / Building A"
                disabled={disabled}
              />
            </div>
            {towers.length > 1 && (
              <Button type="button" variant="outline" size="icon" onClick={() => removeTower(ti)} aria-label="Remove tower" disabled={disabled}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <Label>Wings & flat number ranges *</Label>
            {tower.wings.map((wing, wi) => (
              <div key={wi} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end">
                <div className="space-y-1">
                  {wi === 0 && <Label className="text-xs text-muted-foreground">Wing</Label>}
                  <Input
                    value={wing.wing}
                    onChange={(e) => updateWing(ti, wi, "wing", e.target.value.toUpperCase())}
                    placeholder="A"
                    disabled={disabled}
                  />
                </div>
                <div className="space-y-1">
                  {wi === 0 && <Label className="text-xs text-muted-foreground">From flat #</Label>}
                  <Input
                    inputMode="numeric"
                    value={wing.flat_from}
                    onChange={(e) => updateWing(ti, wi, "flat_from", e.target.value.replace(/\D/g, ""))}
                    placeholder="101"
                    disabled={disabled}
                  />
                </div>
                <div className="space-y-1">
                  {wi === 0 && <Label className="text-xs text-muted-foreground">To flat #</Label>}
                  <Input
                    inputMode="numeric"
                    value={wing.flat_to}
                    onChange={(e) => updateWing(ti, wi, "flat_to", e.target.value.replace(/\D/g, ""))}
                    placeholder="412"
                    disabled={disabled}
                  />
                </div>
                {tower.wings.length > 1 ? (
                  <Button type="button" variant="outline" size="icon" onClick={() => removeWing(ti, wi)} aria-label="Remove wing" disabled={disabled}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                ) : <div />}
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => addWing(ti)} className="gap-1" disabled={disabled}>
              <Plus className="h-4 w-4" /> Add wing
            </Button>
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" onClick={addTower} className="gap-1" disabled={disabled}>
        <Plus className="h-4 w-4" /> Add building / tower
      </Button>
    </div>
  );
};

export default SocietyStructureBuilder;
