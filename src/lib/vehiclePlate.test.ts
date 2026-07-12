import { describe, it, expect } from "vitest";
import { parsePlate } from "@/lib/vehiclePlate";

/** Re-combines a parsed result back into a plate string, mirroring the
 * component's own emit logic, to test round-trip correctness. */
function reassemble(p: ReturnType<typeof parsePlate>): string {
  if (p.isBH) return p.year ? `${p.year}BH${p.number}${p.series}` : "";
  return `${p.state}${p.district}${p.series}${p.number}`;
}

describe("parsePlate - standard plates", () => {
  it("parses a well-formed standard plate", () => {
    const p = parsePlate("MH02AB1234");
    expect(p).toMatchObject({ isBH: false, state: "MH", district: "02", series: "AB", number: "1234" });
  });

  it("parses a plate with a single-letter series", () => {
    const p = parsePlate("DL01C5555");
    expect(p).toMatchObject({ isBH: false, state: "DL", district: "01", series: "C", number: "5555" });
  });

  it("is case-insensitive and strips separators (hyphens/spaces)", () => {
    const p = parsePlate("mh-02-ab-1234");
    expect(p).toMatchObject({ state: "MH", district: "02", series: "AB", number: "1234" });
  });

  it("round-trips correctly back to the original plate string", () => {
    for (const plate of ["MH02AB1234", "DL01CA5555", "KA03X9"]) {
      expect(reassemble(parsePlate(plate))).toBe(plate);
    }
  });

  it("handles partial/in-progress input without throwing (e.g. mid-typing)", () => {
    expect(() => parsePlate("MH")).not.toThrow();
    expect(() => parsePlate("MH0")).not.toThrow();
    expect(parsePlate("MH").state).toBe("MH");
    expect(parsePlate("MH").district).toBe("");
  });

  it("caps series at 3 letters and number at 4 digits even with extra input", () => {
    const p = parsePlate("MH02ABCDE123456");
    expect(p.series.length).toBeLessThanOrEqual(3);
    expect(p.number.length).toBeLessThanOrEqual(4);
  });

  it("treats an empty string as all-empty fields, not an error", () => {
    const p = parsePlate("");
    expect(p).toMatchObject({ isBH: false, state: "", district: "", series: "", number: "" });
  });
});

describe("parsePlate - BH (Bharat) series plates", () => {
  it("parses a well-formed BH-series plate with a 2-letter suffix", () => {
    const p = parsePlate("23BH1234AB");
    expect(p).toMatchObject({ isBH: true, year: "23", number: "1234", series: "AB" });
  });

  it("parses a BH-series plate with a 1-letter suffix", () => {
    const p = parsePlate("23BH1234A");
    expect(p).toMatchObject({ isBH: true, year: "23", number: "1234", series: "A" });
  });

  it("is case-insensitive for the BH literal", () => {
    const p = parsePlate("23bh1234ab");
    expect(p.isBH).toBe(true);
  });

  it("round-trips correctly back to the original plate string", () => {
    for (const plate of ["23BH1234AB", "23BH1234A", "01BH0001XY"]) {
      expect(reassemble(parsePlate(plate))).toBe(plate);
    }
  });

  it("does not misdetect a standard plate that merely starts with digits as BH-series", () => {
    // "23" are just digits, not followed by "BH" -- must not be treated as BH-series
    const p = parsePlate("23AB1234");
    expect(p.isBH).toBe(false);
  });

  it("correctly distinguishes BH-series from a state code that happens to start similarly", () => {
    // A real state code is always 2 letters, never 2 digits -- so digit-led input is unambiguous
    const bh = parsePlate("07BH1234C");
    expect(bh.isBH).toBe(true);
    expect(bh.year).toBe("07");
  });
});
