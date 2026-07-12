import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { parsePlate } from "@/lib/vehiclePlate";

/** Official Indian state/UT RTO codes (stable, MoRTH-assigned -- safe to hardcode). */
const INDIAN_STATE_CODES = [
  "AN", "AP", "AR", "AS", "BR", "CH", "CG", "DD", "DL", "DN", "GA", "GJ",
  "HR", "HP", "JH", "JK", "KA", "KL", "LA", "LD", "MH", "ML", "MN", "MP",
  "MZ", "NL", "OD", "PB", "PY", "RJ", "SK", "TN", "TG", "TR", "UK", "UP", "WB",
];

interface VehicleNumberInputProps {
  /** Combined plate string, e.g. "MH02AB1234" or "23BH1234AB" -- same format as before, no schema change needed. */
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

/**
 * Segmented Indian vehicle-number entry -- same UX pattern as metersahi.in's
 * "Report this vehicle" form. Emits the same combined string other code expects,
 * so no downstream schema, QR, or search logic changes.
 *
 * Supports both plate formats:
 * - Standard: State (dropdown) / District (2-digit) / Series (letters) / Number (digits)
 * - BH series (Bharat, for vehicles that move across states): Year (2-digit) /
 *   "BH" (fixed) / Number (digits) / Series (letters) -- note the segment ORDER
 *   is different (number before series), not just different values, since it's
 *   a genuinely different plate format, not a variant of the standard one.
 *
 * Note: District is a plain 2-digit field rather than a dropdown of RTO codes --
 * a complete, verified list of RTO codes per state wasn't available to hardcode
 * accurately, so this keeps the guided-entry benefit without risking wrong data.
 */
const VehicleNumberInput = ({ value, onChange, className, disabled }: VehicleNumberInputProps) => {
  const initial = parsePlate(value);
  const [isBH, setIsBH] = useState(initial.isBH);
  const [state, setState] = useState(initial.state);
  const [district, setDistrict] = useState(initial.district);
  const [year, setYear] = useState(initial.year);
  const [series, setSeries] = useState(initial.series);
  const [number, setNumber] = useState(initial.number);

  const secondRef = useRef<HTMLInputElement>(null);
  const thirdRef = useRef<HTMLInputElement>(null);
  const fourthRef = useRef<HTMLInputElement>(null);

  // Keep segments in sync if the parent resets `value` externally (e.g. form reset after submit).
  useEffect(() => {
    const p = parsePlate(value);
    setIsBH(p.isBH);
    setState(p.state);
    setDistrict(p.district);
    setYear(p.year);
    setSeries(p.series);
    setNumber(p.number);
  }, [value]);

  const emitStandard = (s: string, d: string, sr: string, n: string) => onChange(`${s}${d}${sr}${n}`);
  const emitBH = (y: string, n: string, sr: string) => onChange(y ? `${y}BH${n}${sr}` : "");

  const toggleBH = (checked: boolean) => {
    setIsBH(checked);
    // Clear segments that don't carry over cleanly between the two formats (state/district vs year).
    if (checked) {
      setState("");
      setDistrict("");
      emitBH(year, number, series);
    } else {
      setYear("");
      emitStandard(state, district, series, number);
    }
  };

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-2">
        <Checkbox id="bh-series-toggle" checked={isBH} onCheckedChange={(v) => toggleBH(!!v)} disabled={disabled} />
        <label htmlFor="bh-series-toggle" className="text-xs text-muted-foreground cursor-pointer">
          BH series (Bharat) plate
        </label>
      </div>

      {isBH ? (
        <div className="grid grid-cols-4 gap-2">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Year</span>
            <Input
              value={year}
              maxLength={2}
              inputMode="numeric"
              placeholder="23"
              disabled={disabled}
              className="touch-target text-center"
              onChange={(e) => {
                const v = e.target.value.replace(/[^0-9]/g, "").slice(0, 2);
                setYear(v);
                emitBH(v, number, series);
                if (v.length === 2) secondRef.current?.focus();
              }}
            />
          </div>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">&nbsp;</span>
            <Input value="BH" disabled className="touch-target text-center bg-muted font-medium" />
          </div>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Number</span>
            <Input
              ref={secondRef}
              value={number}
              maxLength={4}
              inputMode="numeric"
              placeholder="1234"
              disabled={disabled}
              className="touch-target text-center"
              onChange={(e) => {
                const v = e.target.value.replace(/[^0-9]/g, "").slice(0, 4);
                setNumber(v);
                emitBH(year, v, series);
                if (v.length === 4) thirdRef.current?.focus();
              }}
              onKeyDown={(e) => { if (e.key === "Backspace" && number === "") secondRef.current?.focus(); }}
            />
          </div>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Series</span>
            <Input
              ref={thirdRef}
              value={series}
              maxLength={2}
              placeholder="A"
              disabled={disabled}
              className="touch-target text-center uppercase"
              onChange={(e) => {
                const v = e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 2);
                setSeries(v);
                emitBH(year, number, v);
              }}
              onKeyDown={(e) => { if (e.key === "Backspace" && series === "") thirdRef.current?.focus(); }}
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">State</span>
            <Select
              value={state || undefined}
              disabled={disabled}
              onValueChange={(v) => {
                setState(v);
                emitStandard(v, district, series, number);
                if (v) secondRef.current?.focus();
              }}
            >
              <SelectTrigger className="touch-target">
                <SelectValue placeholder="–" />
              </SelectTrigger>
              <SelectContent>
                {INDIAN_STATE_CODES.map((code) => (
                  <SelectItem key={code} value={code}>{code}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">District</span>
            <Input
              ref={secondRef}
              value={district}
              maxLength={2}
              inputMode="numeric"
              placeholder="02"
              disabled={disabled}
              className="touch-target text-center"
              onChange={(e) => {
                const v = e.target.value.replace(/[^0-9]/g, "").slice(0, 2);
                setDistrict(v);
                emitStandard(state, v, series, number);
                if (v.length === 2) thirdRef.current?.focus();
              }}
            />
          </div>

          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Series</span>
            <Input
              ref={thirdRef}
              value={series}
              maxLength={3}
              placeholder="AB"
              disabled={disabled}
              className="touch-target text-center uppercase"
              onChange={(e) => {
                const v = e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3);
                setSeries(v);
                emitStandard(state, district, v, number);
                if (v.length === 3) fourthRef.current?.focus();
              }}
              onKeyDown={(e) => { if (e.key === "Backspace" && series === "") secondRef.current?.focus(); }}
            />
          </div>

          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Number</span>
            <Input
              ref={fourthRef}
              value={number}
              maxLength={4}
              inputMode="numeric"
              placeholder="1234"
              disabled={disabled}
              className="touch-target text-center"
              onChange={(e) => {
                const v = e.target.value.replace(/[^0-9]/g, "").slice(0, 4);
                setNumber(v);
                emitStandard(state, district, series, v);
              }}
              onKeyDown={(e) => { if (e.key === "Backspace" && number === "") thirdRef.current?.focus(); }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleNumberInput;
