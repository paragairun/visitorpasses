import { useCallback, useEffect, useState } from "react";
import { Calendar, Clock, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface StaffLog {
  id: string; staff_id: string; category: "society_staff" | "house_help";
  action_type: "entry" | "exit"; timestamp: string;
}

interface DaySummary {
  date: string; staff_id: string; staff_name: string; staff_role: string;
  first_entry: string | null; last_exit: string | null; hours_worked: number | null;
}

interface StaffAttendanceLogProps {
  filterStaffId?: string;
  filterCategory?: "society_staff" | "house_help" | "all";
  showSummary?: boolean;
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const StaffAttendanceLog = ({ filterStaffId, filterCategory = "all", showSummary = true }: StaffAttendanceLogProps) => {
  const { societyId, roles } = useAuth();
  const isAdmin = roles.includes("admin");
  const isResident = roles.includes("resident");
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [logs, setLogs] = useState<StaffLog[]>([]);
  const [nameMap, setNameMap] = useState<Record<string, { name: string; role: string }>>({});
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!societyId) return;
    setLoading(true);
    const start = new Date(year, month, 1).toISOString();
    const end = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

    let q = supabase.from("staff_logs").select("*").eq("society_id", societyId)
      .gte("timestamp", start).lte("timestamp", end).order("timestamp", { ascending: false });
    if (filterStaffId) q = q.eq("staff_id", filterStaffId);
    if (filterCategory !== "all") q = q.eq("category", filterCategory);
    if (isResident && !isAdmin) q = q.eq("category", "house_help");

    const { data: logData } = await q;
    const fetched = (logData ?? []) as StaffLog[];
    const ids = [...new Set(fetched.map((l) => l.staff_id))];
    const map: Record<string, { name: string; role: string }> = {};

    if (ids.length > 0) {
      const [{ data: sd }, { data: hd }] = await Promise.all([
        supabase.from("staff_members").select("id, name, staff_type").in("id", ids),
        supabase.from("house_helps").select("id, name, help_type").in("id", ids),
      ]);
      (sd ?? []).forEach((s: { id: string; name: string; staff_type: string }) => { map[s.id] = { name: s.name, role: s.staff_type }; });
      (hd ?? []).forEach((h: { id: string; name: string; help_type: string }) => { map[h.id] = { name: h.name, role: h.help_type }; });
    }

    setNameMap(map);
    setLogs(fetched);
    setLoading(false);
  }, [societyId, month, year, filterStaffId, filterCategory, isAdmin, isResident]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  // Build daily summary
  const summary: DaySummary[] = (() => {
    const byDayStaff: Record<string, Record<string, StaffLog[]>> = {};
    logs.forEach((l) => {
      const day = l.timestamp.slice(0, 10);
      if (!byDayStaff[day]) byDayStaff[day] = {};
      if (!byDayStaff[day][l.staff_id]) byDayStaff[day][l.staff_id] = [];
      byDayStaff[day][l.staff_id].push(l);
    });
    const result: DaySummary[] = [];
    Object.entries(byDayStaff).sort((a, b) => b[0].localeCompare(a[0])).forEach(([date, staffMap]) => {
      Object.entries(staffMap).forEach(([staffId, entries]) => {
        const info = nameMap[staffId];
        const entryTimes = entries.filter((e) => e.action_type === "entry").map((e) => e.timestamp).sort();
        const exitTimes = entries.filter((e) => e.action_type === "exit").map((e) => e.timestamp).sort().reverse();
        const first_entry = entryTimes[0] ?? null;
        const last_exit = exitTimes[0] ?? null;
        let hours_worked: number | null = null;
        if (first_entry && last_exit && last_exit > first_entry) {
          hours_worked = Math.round((new Date(last_exit).getTime() - new Date(first_entry).getTime()) / 36000) / 100;
        }
        result.push({ date, staff_id: staffId, staff_name: info?.name ?? "Unknown", staff_role: info?.role ?? "", first_entry, last_exit, hours_worked });
      });
    });
    return result;
  })();

  const avgHours = (() => {
    const withHours = summary.filter((d) => d.hours_worked !== null);
    if (withHours.length === 0) return null;
    return Math.round(withHours.reduce((s, d) => s + (d.hours_worked ?? 0), 0) / withHours.length * 10) / 10;
  })();

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-end">
        <div className="space-y-1">
          <Label className="text-xs">Month</Label>
          <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>{MONTHS.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Year</Label>
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
            <SelectContent>{[now.getFullYear()-1, now.getFullYear()].map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      {showSummary && !loading && summary.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <Card><CardContent className="p-3 text-center">
            <Calendar className="h-4 w-4 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{summary.length}</p>
            <p className="text-xs text-muted-foreground">Days present</p>
          </CardContent></Card>
          <Card><CardContent className="p-3 text-center">
            <Clock className="h-4 w-4 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{avgHours ?? "—"}</p>
            <p className="text-xs text-muted-foreground">Avg hrs/day</p>
          </CardContent></Card>
          <Card><CardContent className="p-3 text-center">
            <TrendingUp className="h-4 w-4 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{logs.length}</p>
            <p className="text-xs text-muted-foreground">Total scans</p>
          </CardContent></Card>
        </div>
      )}

      {loading ? (
        <div className="py-8 flex justify-center"><div className="h-6 w-6 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : summary.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">No attendance records for this period.</p>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40">
              <tr>
                <th className="text-left p-2 font-medium text-muted-foreground text-xs">Date</th>
                {!filterStaffId && <th className="text-left p-2 font-medium text-muted-foreground text-xs">Name</th>}
                <th className="text-left p-2 font-medium text-muted-foreground text-xs">In</th>
                <th className="text-left p-2 font-medium text-muted-foreground text-xs">Out</th>
                <th className="text-left p-2 font-medium text-muted-foreground text-xs">Hrs</th>
              </tr>
            </thead>
            <tbody>
              {summary.map((d, i) => (
                <tr key={i} className="border-t border-border/50">
                  <td className="p-2 text-xs text-muted-foreground">{new Date(d.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</td>
                  {!filterStaffId && <td className="p-2"><p className="font-medium text-xs">{d.staff_name}</p><p className="text-xs text-muted-foreground">{d.staff_role}</p></td>}
                  <td className="p-2 font-mono text-xs">{d.first_entry ? new Date(d.first_entry).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                  <td className="p-2 font-mono text-xs">{d.last_exit ? new Date(d.last_exit).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                  <td className="p-2 font-mono text-xs">{d.hours_worked !== null ? `${d.hours_worked}h` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StaffAttendanceLog;
