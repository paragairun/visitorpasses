/**
 * Parses a combined plate string into its segments, detecting BH-series
 * (Bharat series) plates -- format "YY BH NNNN X[X]", e.g. "23BH1234AB" --
 * which read in a different order to standard plates ("SS DD XX NNNN",
 * e.g. "MH02AB1234": number comes last, not right after the state/year).
 *
 * Kept in its own file (rather than inside VehicleNumberInput.tsx) so it can
 * be unit tested directly, and so this file only exports plain functions --
 * mixing component and non-component exports in one file breaks Fast Refresh
 * during dev.
 */
export function parsePlate(value: string) {
  const clean = (value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");

  // BH-series: 2 digits (year) followed by the literal "BH"
  if (/^[0-9]{2}BH/.test(clean)) {
    const year = clean.slice(0, 2);
    const rest = clean.slice(4);
    const number = rest.match(/^([0-9]{0,4})/)?.[1] ?? "";
    const series = rest.slice(number.length).replace(/[^A-Z]/g, "").slice(0, 2);
    return { isBH: true, state: "", district: "", series, number, year };
  }

  const state = clean.match(/^([A-Z]{0,2})/)?.[1] ?? "";
  const rest1 = clean.slice(state.length);
  const district = rest1.match(/^([0-9]{0,2})/)?.[1] ?? "";
  const rest2 = rest1.slice(district.length);
  const series = rest2.match(/^([A-Z]{0,3})/)?.[1] ?? "";
  const number = rest2.slice(series.length).replace(/[^0-9]/g, "").slice(0, 4);
  return { isBH: false, state, district, series, number, year: "" };
}
