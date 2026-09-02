import React, { useEffect, useMemo, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { CARD } from "../../lib/surfaces";
import { AccentEdge } from "../ui/CardAccents";
import { useThemeAccent } from "../../hooks/useThemeAccent";
import { attendanceAPI } from "../../services/api";

/**
 * This month's attendance, as a donut.
 *
 * What it counts depends on who is looking:
 *   employee - their own days, split Present / Late / Absent
 *   admin    - the whole workforce, as employee-days recorded against
 *              employee-days expected over the days the device was active
 *
 * Both views count employee-DAYS, not people, so a month reads as a workload
 * rather than a headcount. "Absent" means no punch on a day the device saw
 * others; it is a gap in the record, not a claim about leave - the device
 * cannot tell leave from another site or an unenrolled worker.
 *
 * Each slice is labelled in the legend and named in the tooltip, so the split
 * is never carried by colour alone.
 */

interface Props {
  role?: string;
  /** The signed-in employee's device User ID. Required for the employee view. */
  employeeId?: string | number;
}

const LATE = "#b5650a";
const ABSENT = "#b42318";

/** First and last day of the current month, as YYYY-MM-DD. */
function currentMonthRange() {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = now.getFullYear();
  const m = now.getMonth();
  const last = new Date(y, m + 1, 0).getDate();
  return {
    from: `${y}-${pad(m + 1)}-01`,
    to: `${y}-${pad(m + 1)}-${pad(last)}`,
    label: now.toLocaleDateString(undefined, { month: "long", year: "numeric" }),
  };
}

const AttendancePieCard: React.FC<Props> = ({ role, employeeId }) => {
  const accent = useThemeAccent(600);
  const [slices, setSlices] = useState<
    { name: string; value: number; color: string }[]
  >([]);
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const range = useMemo(currentMonthRange, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError("");
      try {
        if (role === "employee") {
          if (!employeeId) {
            if (!cancelled) {
              setError("No device ID is linked to your account yet.");
              setSlices([]);
            }
            return;
          }

          const res = await attendanceAPI.getEmployeeAttendance(
            "",
            String(employeeId),
            range.from,
            range.to
          );
          const s = res.data?.summary;
          if (!s) throw new Error("No attendance summary returned");

          if (cancelled) return;
          setSlices([
            {
              name: "On time",
              value: Math.max(0, (s.presentDays || 0) - (s.lateDays || 0)),
              color: accent,
            },
            { name: "Late", value: s.lateDays || 0, color: LATE },
            { name: "Absent", value: s.absentDays || 0, color: ABSENT },
          ]);
          setCaption(`Your working days in ${range.label}`);
        } else {
          // One aggregate for the whole workforce, split the same way an
          // individual's is: on-time days, late days, and days with no punch.
          const res = await attendanceAPI.getAttendanceStatusSummary(
            range.from,
            range.to
          );
          const d = res.data;
          if (!d?.success || !d.activeDays) {
            if (!cancelled) {
              setSlices([]);
              setCaption(`No attendance recorded in ${range.label}`);
            }
            return;
          }

          if (cancelled) return;
          setSlices([
            { name: "On time", value: d.onTime || 0, color: accent },
            { name: "Late", value: d.late || 0, color: LATE },
            { name: "Absent", value: d.absent || 0, color: ABSENT },
          ]);
          setCaption(
            `${d.totalEmployees} people over ${d.activeDays} working days, against ${d.cutoffTime}`
          );
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(
            err?.response?.data?.message ||
              err?.message ||
              "Could not load attendance"
          );
          setSlices([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [role, employeeId, range.from, range.to, accent]);

  const total = slices.reduce((sum, s) => sum + s.value, 0);
  const headline = slices.length
    ? Math.round(((slices[0]?.value || 0) / (total || 1)) * 100)
    : 0;

  return (
    <div className={`relative overflow-hidden ${CARD} p-5 sm:p-6`}>
      <AccentEdge color={accent} />

      <div className="mb-4">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Attendance this month
        </p>
        <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
          {caption || range.label}
        </p>
      </div>

      {loading ? (
        <div className="flex h-[190px] items-center justify-center">
          <div className="h-32 w-32 animate-pulse rounded-full bg-gray-100 dark:bg-gray-700" />
        </div>
      ) : error ? (
        <p className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
          {error}
        </p>
      ) : !total ? (
        <p className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
          Nothing recorded yet this month.
        </p>
      ) : (
        <>
          <div className="relative" style={{ height: 190 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={slices}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={58}
                  outerRadius={84}
                  paddingAngle={2}
                  stroke="none"
                >
                  {slices.map((s) => (
                    <Cell key={s.name} fill={s.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any, name: any) => [
                    `${value} (${Math.round((Number(value) / total) * 100)}%)`,
                    name,
                  ]}
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid rgb(229 232 237)",
                    fontSize: 12.5,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Centre reading: the first slice's share, which is the good one. */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold tabular-nums text-gray-900 dark:text-white">
                {headline}%
              </span>
              <span className="text-[11px] text-gray-400">
                {slices[0]?.name}
              </span>
            </div>
          </div>

          <div className="mt-3 space-y-1.5">
            {slices.map((s) => (
              <div
                key={s.name}
                className="flex items-center justify-between text-[13px]"
              >
                <span className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                  <span
                    className="h-2 w-2 rounded-sm"
                    style={{ background: s.color }}
                  />
                  {s.name}
                </span>
                <span className="flex items-center gap-2">
                  <span className="font-semibold tabular-nums text-gray-900 dark:text-gray-100">
                    {s.value}
                  </span>
                  <span className="w-9 text-right text-xs text-gray-400">
                    {Math.round((s.value / total) * 100)}%
                  </span>
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default AttendancePieCard;
