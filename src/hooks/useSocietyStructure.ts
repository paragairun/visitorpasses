import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { NormalizedTower, generateFlatNumbers } from "@/components/SocietyStructureBuilder";

/**
 * Loads the approved structure (towers -> wings -> flat number ranges) for a society.
 * Returns an empty array if the society has no structure defined yet (e.g. legacy societies),
 * in which case consuming components should fall back to free-text inputs.
 */
export const useSocietyStructure = (societyId: string | null | undefined) => {
  const [structure, setStructure] = useState<NormalizedTower[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!societyId) {
      setStructure([]);
      return;
    }
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
        if (error || !data?.structure) {
          setStructure([]);
          return;
        }
        setStructure((data.structure ?? []) as NormalizedTower[]);
      });
    return () => { active = false; };
  }, [societyId]);

  /** Generate the list of flat numbers for a given wing, based on its range/floor settings. */
  const flatsForWing = (wing: string): string[] => {
    for (const tower of structure) {
      const w = tower.wings.find((x) => x.wing === wing);
      if (w) return generateFlatNumbers(w);
    }
    return [];
  };

  /** All wings across all towers, with their parent tower name. */
  const allWings = structure.flatMap((tower) =>
    tower.wings.map((w) => ({ tower_name: tower.tower_name, wing: w.wing }))
  );

  return { structure, loading, hasStructure: structure.length > 0, allWings, flatsForWing };
};
