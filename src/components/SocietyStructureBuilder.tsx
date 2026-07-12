import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  WingStructure, TowerStructure,
  emptyWing, emptyTower,
} from "@/lib/societyStructure";

// ─── Component ───────────────────────────────────────────────────────────────

interface SocietyStructureBuilderProps {
  towers: TowerStructure[];
  floorWise: boolean;
  flatsPerFloor: string;
  onChangeTowers: (towers: TowerStructure[]) => void;
  onChangeFloorWise: (v: boolean) => void;
  onChangeFlatsPerFloor: (v: string) => void;
  disabled?: boolean;
}

const SocietyStructureBuilder = ({
  towers, floorWise, flatsPerFloor,
  onChangeTowers, onChangeFloorWise, onChangeFlatsPerFloor,
  disabled,
}: SocietyStructureBuilderProps) => {
  const addTower = () => onChangeTowers([...towers, emptyTower()]);
  const removeTower = (ti: number) => onChangeTowers(towers.filter((_, i) => i !== ti));
  const updateTowerName = (ti: number, name: string) =>
    onChangeTowers(towers.map((t, i) => (i === ti ? { ...t, tower_name: name } : t)));

  const addWing = (ti: number) =>
    onChangeTowers(towers.map((t, i) => (i === ti ? { ...t, wings: [...t.wings, emptyWing()] } : t)));
  const removeWing = (ti: number, wi: number) =>
    onChangeTowers(towers.map((t, i) => (i === ti ? { ...t, wings: t.wings.filter((_, j) => j !== wi) } : t)));
  const updateWing = <K extends keyof WingStructure>(ti: number, wi: number, field: K, value: WingStructure[K]) =>
    onChangeTowers(towers.map((t, i) => {
      if (i !== ti) return t;
      return { ...t, wings: t.wings.map((w, j) => (j === wi ? { ...w, [field]: value } : w)) };
    }));

  return (
    <div className="space-y-4">
      {/* Society-level floor-wise numbering toggle */}
      <div className="rounded-lg border border-border/60 bg-secondary/20 p-3 space-y-3">
        <div className="flex items-center gap-2">
          <Checkbox
            id="floor-wise-global"
            checked={floorWise}
            onCheckedChange={(v) => onChangeFloorWise(v === true)}
            disabled={disabled}
          />
          <Label htmlFor="floor-wise-global" className="font-medium cursor-pointer">
            Floor-wise flat numbering
          </Label>
        </div>
        <p className="text-xs text-muted-foreground pl-6">
          When enabled, flat numbers restart each floor using the last 2 digits as the unit
          (e.g. 101–104 on floor 1, then 201–204 on floor 2). Applies to all wings across all towers.
        </p>
        {floorWise && (
          <div className="pl-6 max-w-xs space-y-1">
            <Label className="text-xs text-muted-foreground">Flats per floor (same for all wings)</Label>
            <Input
              inputMode="numeric"
              value={flatsPerFloor}
              onChange={(e) => onChangeFlatsPerFloor(e.target.value.replace(/\D/g, ""))}
              placeholder="4"
              disabled={disabled}
              className="max-w-[120px]"
            />
          </div>
        )}
      </div>

      {/* Towers + wings */}
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
                  {wi === 0 && <Label className="text-xs text-muted-foreground">First flat #</Label>}
                  <Input
                    inputMode="numeric"
                    value={wing.flat_from}
                    onChange={(e) => updateWing(ti, wi, "flat_from", e.target.value.replace(/\D/g, ""))}
                    placeholder="101"
                    disabled={disabled}
                  />
                </div>
                <div className="space-y-1">
                  {wi === 0 && (
                    <Label className="text-xs text-muted-foreground">
                      {floorWise ? "No. of floors" : "Last flat #"}
                    </Label>
                  )}
                  <Input
                    inputMode="numeric"
                    value={floorWise ? wing.total_floors : wing.flat_to}
                    onChange={(e) =>
                      updateWing(ti, wi, floorWise ? "total_floors" : "flat_to", e.target.value.replace(/\D/g, ""))
                    }
                    placeholder={floorWise ? "10" : "412"}
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
