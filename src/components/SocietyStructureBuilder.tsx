import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export interface WingStructure {
  wing: string;
  flat_from: string;
  flat_to: string;
  /** If true, flat numbering restarts each floor based on flats_per_floor (see floorWiseFlats). */
  floor_wise: boolean;
  /** Number of flats on each floor (required when floor_wise is true). */
  flats_per_floor: string;
  /** Number of floors (used instead of flat_to when floor_wise is true). */
  total_floors: string;
}

export interface NormalizedWing {
  wing: string;
  flat_from: number;
  /** Last flat number. For floor_wise wings, this is computed from flat_from/flats_per_floor/total_floors. */
  flat_to: number;
  floor_wise: boolean;
  flats_per_floor?: number;
  total_floors?: number;
}

export interface TowerStructure {
  tower_name: string;
  wings: WingStructure[];
}

export interface NormalizedTower {
  tower_name: string;
  wings: NormalizedWing[];
}

export const emptyWing = (): WingStructure => ({
  wing: "", flat_from: "", flat_to: "", floor_wise: false, flats_per_floor: "", total_floors: "",
});
export const emptyTower = (): TowerStructure => ({ tower_name: "", wings: [emptyWing()] });

/**
 * Generates the list of flat numbers for a wing, honoring floor-wise numbering if enabled.
 * For floor-wise wings: last 2 digits of flat_from are the starting unit number (e.g. 01),
 * everything before that is the starting floor prefix. Each floor produces `flats_per_floor`
 * consecutive flats starting at that unit, then the floor prefix increments by a power of 10
 * matching its own digit-width (e.g. prefix "1" -> +1, prefix "10" -> +10, prefix "100" -> +100).
 */
export const generateFlatNumbers = (wing: NormalizedWing): string[] => {
  if (!wing.floor_wise || !wing.flats_per_floor || !wing.total_floors) {
    const flats: string[] = [];
    for (let n = wing.flat_from; n <= wing.flat_to; n++) flats.push(String(n));
    return flats;
  }
  const floorPrefix = Math.floor(wing.flat_from / 100);
  const startUnit = wing.flat_from % 100;
  const prefixDigits = floorPrefix === 0 ? 1 : Math.floor(Math.log10(floorPrefix)) + 1;
  const prefixStep = Math.pow(10, prefixDigits - 1);
  const flats: string[] = [];
  for (let floor = 0; floor < wing.total_floors; floor++) {
    const currentPrefix = floorPrefix + floor * prefixStep;
    for (let i = 0; i < wing.flats_per_floor; i++) {
      const unit = startUnit + i;
      flats.push(String(currentPrefix * 100 + unit));
    }
  }
  return flats;
};

/** Convert normalized (numbers) structure from the DB into editable string-based form state. */
export const toEditableTowers = (towers: NormalizedTower[]): TowerStructure[] => {
  if (!towers || towers.length === 0) return [emptyTower()];
  return towers.map((t) => ({
    tower_name: t.tower_name,
    wings: t.wings.length > 0
      ? t.wings.map((w) => ({
          wing: w.wing,
          flat_from: String(w.flat_from),
          flat_to: String(w.flat_to),
          floor_wise: !!w.floor_wise,
          flats_per_floor: w.flats_per_floor ? String(w.flats_per_floor) : "",
          total_floors: w.total_floors ? String(w.total_floors) : "",
        }))
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
    if (!towerName && tower.wings.every((w) => !w.wing.trim() && !w.flat_from.trim() && !w.flat_to.trim() && !w.flats_per_floor.trim() && !w.total_floors.trim())) {
      continue;
    }
    if (!towerName) {
      return { error: "Enter a name for every tower/building" };
    }
    const wings: NormalizedWing[] = [];
    for (const w of tower.wings) {
      const wingName = w.wing.trim().toUpperCase();
      const isEmpty = !wingName && !w.flat_from.trim() && !w.flat_to.trim() && !w.flats_per_floor.trim() && !w.total_floors.trim();
      if (isEmpty) continue;
      if (!wingName) {
        return { error: `Enter a wing name for ${towerName}` };
      }
      const from = Number(w.flat_from);
      if (!w.flat_from.trim() || !Number.isFinite(from) || from <= 0) {
        return { error: `Enter a valid starting flat number for ${towerName} - Wing ${wingName}` };
      }

      if (w.floor_wise) {
        const perFloor = Number(w.flats_per_floor);
        const floors = Number(w.total_floors);
        if (!w.flats_per_floor.trim() || !Number.isFinite(perFloor) || perFloor <= 0) {
          return { error: `Enter a valid number of flats per floor for ${towerName} - Wing ${wingName}` };
        }
        if (perFloor > 99) {
          return { error: `Flats per floor must be 99 or fewer (2-digit unit numbers) for ${towerName} - Wing ${wingName}` };
        }
        if (!w.total_floors.trim() || !Number.isFinite(floors) || floors <= 0) {
          return { error: `Enter a valid number of floors for ${towerName} - Wing ${wingName}` };
        }
        const startUnit = from % 100;
        if (startUnit + perFloor - 1 > 99) {
          return { error: `Starting flat number + flats per floor exceeds 99 for the unit part, for ${towerName} - Wing ${wingName}. Adjust the starting flat number.` };
        }
        const floorPrefix = Math.floor(from / 100);
        const prefixDigits = floorPrefix === 0 ? 1 : Math.floor(Math.log10(floorPrefix)) + 1;
        const prefixStep = Math.pow(10, prefixDigits - 1);
        const lastPrefix = floorPrefix + (floors - 1) * prefixStep;
        const lastFlat = lastPrefix * 100 + startUnit + perFloor - 1;
        wings.push({ wing: wingName, flat_from: from, flat_to: lastFlat, floor_wise: true, flats_per_floor: perFloor, total_floors: floors });
      } else {
        const to = Number(w.flat_to);
        if (!w.flat_to.trim() || !Number.isFinite(to) || to <= 0) {
          return { error: `Enter a valid flat number range for ${towerName} - Wing ${wingName}` };
        }
        if (from > to) {
          return { error: `Flat range start must be \u2264 end for ${towerName} - Wing ${wingName}` };
        }
        wings.push({ wing: wingName, flat_from: from, flat_to: to, floor_wise: false });
      }
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
  const updateWing = <K extends keyof WingStructure>(ti: number, wi: number, field: K, value: WingStructure[K]) =>
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
            <Label>Wings & flat numbering *</Label>
            {tower.wings.map((wing, wi) => (
              <div key={wi} className="rounded-md border border-border/60 p-2 space-y-2">
                <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end">
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
                  {wing.floor_wise ? (
                    <div className="space-y-1">
                      {wi === 0 && <Label className="text-xs text-muted-foreground">Total floors</Label>}
                      <Input
                        inputMode="numeric"
                        value={wing.total_floors}
                        onChange={(e) => updateWing(ti, wi, "total_floors", e.target.value.replace(/\D/g, ""))}
                        placeholder="3"
                        disabled={disabled}
                      />
                    </div>
                  ) : (
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
                  )}
                  {tower.wings.length > 1 ? (
                    <Button type="button" variant="outline" size="icon" onClick={() => removeWing(ti, wi)} aria-label="Remove wing" disabled={disabled}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  ) : <div />}
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`floor-wise-${ti}-${wi}`}
                    checked={wing.floor_wise}
                    onCheckedChange={(checked) => updateWing(ti, wi, "floor_wise", checked === true)}
                    disabled={disabled}
                  />
                  <Label htmlFor={`floor-wise-${ti}-${wi}`} className="text-xs text-muted-foreground font-normal cursor-pointer">
                    Floor-wise numbering (e.g. 101-104, then next floor jumps to 201-204)
                  </Label>
                </div>

                {wing.floor_wise && (
                  <div className="grid grid-cols-2 gap-2 max-w-xs">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Flats per floor</Label>
                      <Input
                        inputMode="numeric"
                        value={wing.flats_per_floor}
                        onChange={(e) => updateWing(ti, wi, "flats_per_floor", e.target.value.replace(/\D/g, ""))}
                        placeholder="4"
                        disabled={disabled}
                      />
                    </div>
                  </div>
                )}
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
