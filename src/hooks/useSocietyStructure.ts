import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { NormalizedTower, NormalizedStructure, generateFlatNumbers } from "@/components/SocietyStructureBuilder";

/**
 * Loads the approved structure (towers -> wings -> flat number ranges) for a society.
 * Returns empty state if the society has no structure defined yet (legacy societies),
 * in which case consuming components fall back to free-text inputs.
 */
export const useSocietyStructure = (societyId: string | null | undefined) => {
  const [towers, setTowers] = useState<NormalizedTower[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!societyId) { setTowers([]); return; }
    let active = true;
    setLoading(true);
    void supabase
      .from("society_structure")
      .select("structure")
      .eq("society_id", societyId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        setLoading(false);
        if (error || !data?.structure) { setTowers([]); return; }
        // Handle both old shape (plain array) and new shape ({ floor_wise, towers })
        const raw = data.structure as unknown as NormalizedStructure | NormalizedTower[];
        if (Array.isArray(raw)) {
          setTowers(raw as NormalizedTower[]);
        } else {
          setTowers((raw as NormalizedStructure).towers ?? []);
        }
      });
    return () => { active = false; };
  }, [societyId]);

  /** Returns the tower name for a given wing, or undefined if not found. */
  const towerForWing = (wing: string): string | undefined =>
    towers.find((t) => t.wings.some((w) => w.wing === wing))?.tower_name;

  /**
   * Formats a flat address including tower name when available.
   * e.g. "Tower 1 • Wing A • 101"  or  "A-101" fallback
   */
  const formatFlat = (wing: string, flatNumber: string): string => {
    const tower = towerForWing(wing);
    if (tower) return `${tower} • Wing ${wing} • ${flatNumber}`;
    return `${wing}-${flatNumber}`;
  };

  /** Generate the list of flat numbers for a given wing, based on its range/floor settings. */
  const flatsForWing = (wing: string): string[] => {
    for (const tower of towers) {
      const w = tower.wings.find((x) => x.wing === wing);
      if (w) return generateFlatNumbers(w);
    }
    return [];
  };

  /** All wings across all towers, with their parent tower name. */
  const allWings = towers.flatMap((tower) =>
    tower.wings.map((w) => ({ tower_name: tower.tower_name, wing: w.wing }))
  );

  return {
    structure: towers, // keep 'structure' alias for FlatPicker compatibility
    loading,
    hasStructure: towers.length > 0,
    allWings,
    flatsForWing,
    towerForWing,
    formatFlat,
  };
};
