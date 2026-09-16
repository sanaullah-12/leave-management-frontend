import React, { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  ChartPieIcon,
  CheckIcon,
  ClockIcon,
  PencilIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { SheetIconButton } from "../../mobile/DetailSheet";
import LeaveTrendChart, {
  TooltipCard,
  type LeaveTrendPoint,
} from "../../mobile/LeaveTrendChart";
import { EmptyNote, initialsOf } from "../../mobile/primitives";
import EmployeeLeaveActivity from "../../EmployeeLeaveActivity";
import type { LateEntry, LateSummary } from "../../../hooks/useLateHours";

/**
 * One employee's record, as a phone screen.
 *
 * The desktop page is six stacked cards and two charts; on a phone that is a
 * column you scroll for half a minute before you learn anything. The same
 * material is split across four tabs, each answering one question - who they
 * are, what leave they have, how their attendance looks, what they have asked
 * for - so every answer is one tap rather than one scroll.
 *
 * Nothing is derived here. Every figure arrives as a prop from the page, which
 * is what stops the phone reading and the desktop reading drifting apart one
 * edit at a time; see components/dashboard/mobile for the same arrangement.
 */

export type LeaveKey = "annual" | "sick" | "casual";

export interface LeaveAllocation {
  casual: number;
  sick: number;
  annual: number;
}

interface Balance {
  total: number;
  used: number;
  remaining: number;
}

export interface MobileEmployeeDetailProps {
  employee: any;
  departmentName: string;
  active: boolean;
  isAdmin: boolean;
  onBack: () => void;

  /** Per-type balance, and the two totals the balance card leads with. */
  leaveBalance: Record<LeaveKey, Balance>;
  totalRemaining: number;
  totalAllocated: number;
  leaveMeta: Record<LeaveKey, { label: string; hex: string }>;
  leaveOrder: LeaveKey[];

  /* Allocation editing - admin only, owned by the page. */
  isEditingAllocation: boolean;
  editAllocation: LeaveAllocation;
  onEditAllocation: (next: LeaveAllocation) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveAllocation: () => void;
  savingAllocation: boolean;

  /* Charts. */
  accent: string;
  currentYear: number;
  monthlyData: LeaveTrendPoint[];
  hasTrend: boolean;
  distribution: { name: string; value: number; hex: string }[];

  /* Attendance. */
  lateSummary: LateSummary | null;
  lateEntries: LateEntry[];
  latePolicy: { cutoffTime?: string; graceMinutes?: number } | null;
  lateLoading: boolean;
  lateRangeLabel: string;

  /* History. */
  leaveHistory: any[];
  formatDate: (iso: string) => string;
  statusChip: (status: string) => string;
}

/** The four states counted on this screen. Late and absent carry meaning. */
const ON_TIME_INK = "#0f7a4c";
const LATE_INK = "#b5650a";
const INFO_INK = "#0e7490";

const TABS = [
  { key: "profile", label: "Profile" },
  { key: "leave", label: "Leave" },
  { key: "late", label: "Late" },
  { key: "history", label: "History" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

/* ------------------------------------------------------------------ */
/* Pieces                                                              */
/* ------------------------------------------------------------------ */

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => (
  <section
    className={`rounded-[20px] border border-black/[0.06] bg-[var(--card-surface)] p-4 dark:border-white/[0.07] ${className}`}
  >
    {children}
  </section>
);

const CardHead: React.FC<{
  title: string;
  sub?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}> = ({ title, sub, action, className = "mb-3.5" }) => (
  <div className={`flex items-start justify-between gap-3 ${className}`}>
    <div className="min-w-0">
      <h3 className="truncate text-[14px] font-semibold text-gray-900 dark:text-gray-100">
        {title}
      </h3>
      {sub && (
        <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">
          {sub}
        </p>
      )}
    </div>
    {action && <div className="flex-none">{action}</div>}
  </div>
);

/** A labelled fact inside the information grid. */
const Field: React.FC<{
  label: string;
  value: React.ReactNode;
  wide?: boolean;
  small?: boolean;
  tone?: string;
}> = ({ label, value, wide = false, small = false, tone }) => (
  <div className={wide ? "col-span-2" : undefined}>
    <p className="mb-1 text-[9.5px] font-semibold uppercase tracking-[0.07em] text-gray-400 dark:text-gray-500">
      {label}
    </p>
    <p
      className={`break-words font-semibold text-gray-900 dark:text-gray-100 ${
        small ? "text-[12.5px]" : "text-[13px]"
      }`}
      style={tone ? { color: tone } : undefined}
    >
      {value}
    </p>
  </div>
);

/** A counted figure in a filled well. */
const StatWell: React.FC<{
  tone: string;
  value: React.ReactNode;
  label: string;
  wide?: boolean;
  large?: boolean;
}> = ({ tone, value, label, wide = false, large = false }) => (
  <div
    className={`rounded-[10px] bg-black/[0.035] p-3 dark:bg-white/[0.05] ${
      wide ? "col-span-2" : ""
    }`}
  >
    <span
      aria-hidden="true"
      className="mb-2 block h-1.5 w-1.5 rounded-full"
      style={{ background: tone }}
    />
    <p
      className={`font-bold leading-none tabular-nums text-gray-900 dark:text-gray-100 ${
        large ? "text-[24px]" : "text-[19px]"
      }`}
    >
      {value}
    </p>
    <p className="mt-1.5 text-[10.5px] text-gray-400 dark:text-gray-500">
      {label}
    </p>
  </div>
);

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */

const MobileEmployeeDetail: React.FC<MobileEmployeeDetailProps> = ({
  employee,
  departmentName,
  active,
  isAdmin,
  onBack,
  leaveBalance,
  totalRemaining,
  totalAllocated,
  leaveMeta,
  leaveOrder,
  isEditingAllocation,
  editAllocation,
  onEditAllocation,
  onStartEdit,
  onCancelEdit,
  onSaveAllocation,
  savingAllocation,
  accent,
  currentYear,
  monthlyData,
  hasTrend,
  distribution,
  lateSummary,
  lateEntries,
  latePolicy,
  lateLoading,
  lateRangeLabel,
  leaveHistory,
  formatDate,
  statusChip,
}) => {
  const [tab, setTab] = useState<TabKey>("profile");
  const scrollRef = React.useRef<HTMLDivElement>(null);

  /** Editing the allocation is a Leave-tab job, so the tab comes with it. */
  const startEdit = () => {
    setTab("leave");
    onStartEdit();
  };

  const selectTab = (next: TabKey) => {
    setTab(next);
    // A tab is a new screen, not a continuation of the last one's scroll.
    scrollRef.current?.scrollTo({ top: 0 });
  };

  const cutoff = latePolicy?.cutoffTime;

  return (
    /* The page's own gutters are cancelled: this screen runs edge to edge and
       owns its padding, so the tab strip can sit flush under the header. */
    <div className="-mx-[max(0.75rem,var(--safe-left))] -mt-4 flex min-h-[calc(100dvh-var(--app-bar-h)-var(--safe-top))] flex-col">
      {/* ---------------- Header ---------------- */}
      <div className="flex-shrink-0 px-[max(1.125rem,var(--safe-left))] pb-3.5 pt-0.5">
        <div className="flex items-center justify-between gap-3 py-2">
          <SheetIconButton label="Back" icon={ArrowLeftIcon} onClick={onBack} />
          <h1 className="min-w-0 flex-1 truncate text-center text-[14.5px] font-semibold text-gray-900 dark:text-gray-100">
            Employee Details
          </h1>
          {/* Holds the title centred. There is no second action on this screen
              worth a permanent button, and a menu that opens nothing is worse
              than the space it fills. */}
          <span aria-hidden="true" className="h-[34px] w-[34px] flex-none" />
        </div>

        <div className="mt-2 flex items-center gap-3">
          {employee.profilePicture ? (
            <img
              src={employee.profilePicture}
              alt=""
              className="h-[58px] w-[58px] flex-none rounded-[18px] object-cover"
            />
          ) : (
            <span
              aria-hidden="true"
              className="grid h-[58px] w-[58px] flex-none place-items-center rounded-[18px] text-[22px] font-bold text-white"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, color-mix(in srgb, var(--accent) 72%, white) 0%, var(--accent) 100%)",
              }}
            >
              {initialsOf(employee.name)}
            </span>
          )}
          <div className="min-w-0">
            <h2 className="truncate text-[18px] font-bold leading-tight text-gray-900 dark:text-white">
              {employee.name}
            </h2>
            <p className="mt-0.5 truncate text-[12px] text-gray-400 dark:text-gray-500">
              {[employee.position, departmentName]
                .filter((part) => part && part !== "-")
                .join(" · ") || "Employee"}
            </p>
            <span
              className={`mt-1.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                active
                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                  : "bg-amber-500/15 text-amber-700 dark:text-amber-300"
              }`}
            >
              <span
                aria-hidden="true"
                className={`h-1.5 w-1.5 rounded-full ${
                  active ? "bg-emerald-500" : "bg-amber-500"
                }`}
              />
              {active ? "Active" : employee.status || "Inactive"}
            </span>
          </div>
        </div>

        {isAdmin && !isEditingAllocation && (
          <button
            type="button"
            onClick={startEdit}
            className="mt-3.5 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-[13px] text-[13px] font-semibold text-white transition-transform active:scale-[0.99]"
            style={{
              backgroundImage:
                "linear-gradient(135deg, color-mix(in srgb, var(--accent) 78%, white) 0%, var(--accent) 100%)",
            }}
          >
            <PencilIcon className="h-4 w-4" />
            Edit Allocation
          </button>
        )}
      </div>

      {/* ---------------- Tabs ---------------- */}
      <div
        role="tablist"
        aria-label="Employee record"
        className="mx-[max(1.125rem,var(--safe-left))] flex flex-shrink-0 gap-1 rounded-[13px] border border-black/[0.06] bg-[var(--card-surface)] p-1 dark:border-white/[0.07]"
      >
        {TABS.map((t) => {
          const selected = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => selectTab(t.key)}
              className={`min-h-[36px] flex-1 rounded-[10px] text-[11.5px] font-semibold transition-colors ${
                selected
                  ? "text-white"
                  : "text-gray-500 active:bg-black/5 dark:text-gray-400 dark:active:bg-white/10"
              }`}
              style={
                selected
                  ? {
                      backgroundImage:
                        "linear-gradient(135deg, color-mix(in srgb, var(--accent) 78%, white) 0%, var(--accent) 100%)",
                    }
                  : undefined
              }
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ---------------- Panes ---------------- */}
      <div
        ref={scrollRef}
        className="flex-1 space-y-3.5 px-[max(1.125rem,var(--safe-left))] pb-4 pt-4"
      >
        {/* ---- Profile ---- */}
        {tab === "profile" && (
          <>
            <Card>
              <CardHead
                title="Employee information"
                sub="Record details"
                className="mb-4"
              />
              <div className="grid grid-cols-2 gap-x-2.5 gap-y-3.5">
                <Field label="Employee ID" value={employee.employeeId || "-"} />
                <Field label="Department" value={departmentName} />
                <Field
                  label="Email"
                  value={employee.email || "-"}
                  wide
                  small
                />
                {/* Always shown, even when empty: a missing number is the
                    reason an employee receives no WhatsApp notifications, and
                    hiding the field hides the cause. */}
                <Field label="Phone" value={employee.phone || "-"} small />
                <Field
                  label="Role"
                  value={employee.role === "admin" ? "Administrator" : "Employee"}
                />
                <Field
                  label="Joined"
                  value={employee.joinDate ? formatDate(employee.joinDate) : "-"}
                />
                <Field
                  label="Status"
                  value={active ? "Active" : employee.status || "Inactive"}
                  tone={active ? ON_TIME_INK : LATE_INK}
                />
              </div>
            </Card>

            <Card className="!mb-0">
              <CardHead
                title="At a glance"
                sub={lateRangeLabel}
                className="mb-3"
              />
              <div className="grid grid-cols-2 gap-2">
                <StatWell
                  tone={ON_TIME_INK}
                  value={lateSummary?.onTimeDays ?? 0}
                  label="On time days"
                />
                <StatWell
                  tone={LATE_INK}
                  value={lateSummary?.lateDays ?? 0}
                  label="Late days"
                />
                <StatWell
                  tone="var(--accent)"
                  value={totalRemaining}
                  label="Leave days left"
                />
                <StatWell
                  tone={INFO_INK}
                  value={leaveHistory.length}
                  label="Leave requests"
                />
              </div>
            </Card>
          </>
        )}

        {/* ---- Leave ---- */}
        {tab === "leave" && (
          <>
            <Card>
              <CardHead
                title="Leave balance"
                sub={
                  isEditingAllocation
                    ? "Set this employee's yearly allocation"
                    : "Days remaining, by type"
                }
                className="mb-3"
                action={
                  isAdmin && isEditingAllocation ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={onCancelEdit}
                        aria-label="Cancel"
                        className="grid h-9 w-9 place-items-center rounded-full border border-gray-200 text-gray-500 active:bg-black/5 dark:border-white/10 dark:text-gray-400 dark:active:bg-white/10"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={onSaveAllocation}
                        disabled={savingAllocation}
                        aria-label="Save allocation"
                        className="grid h-9 w-9 place-items-center rounded-full text-white disabled:opacity-60"
                        style={{ backgroundColor: "var(--accent)" }}
                      >
                        <CheckIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ) : undefined
                }
              />

              {!isEditingAllocation && (
                <div className="mb-3.5 flex items-baseline gap-2 border-b border-black/5 pb-3.5 dark:border-white/[0.07]">
                  <span className="text-[34px] font-bold leading-none tabular-nums text-gray-900 dark:text-white">
                    {totalRemaining}
                  </span>
                  <span className="text-[11.5px] text-gray-400 dark:text-gray-500">
                    days left of {totalAllocated}
                  </span>
                </div>
              )}

              <div className="space-y-3.5">
                {leaveOrder.map((key) => {
                  const meta = leaveMeta[key];
                  const bal = leaveBalance[key];
                  const pct = bal.total
                    ? Math.min(100, (bal.remaining / bal.total) * 100)
                    : 0;
                  return (
                    <div key={key}>
                      <div className="mb-1.5 flex items-center gap-2">
                        <span
                          aria-hidden="true"
                          className="h-1.5 w-1.5 flex-none rounded-full"
                          style={{ background: meta.hex }}
                        />
                        <span className="truncate text-[11px] font-semibold uppercase tracking-[0.05em] text-gray-500 dark:text-gray-400">
                          {meta.label}
                        </span>
                        {isEditingAllocation ? (
                          <input
                            type="number"
                            min={0}
                            max={365}
                            inputMode="numeric"
                            value={editAllocation[key]}
                            onChange={(e) =>
                              onEditAllocation({
                                ...editAllocation,
                                [key]: Math.max(0, Number(e.target.value) || 0),
                              })
                            }
                            aria-label={`${meta.label} days per year`}
                            className="ms-auto h-9 w-20 rounded-lg border border-gray-200 bg-transparent px-2 text-right text-[13px] font-bold tabular-nums text-gray-900 focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)] dark:border-white/10 dark:text-gray-100"
                          />
                        ) : (
                          <span className="ms-auto whitespace-nowrap text-[12px] text-gray-400 dark:text-gray-500">
                            <b className="text-[14px] font-bold tabular-nums text-gray-900 dark:text-gray-100">
                              {bal.remaining}
                            </b>{" "}
                            of {bal.total} days
                          </span>
                        )}
                      </div>
                      {!isEditingAllocation && (
                        <div className="h-[5px] overflow-hidden rounded-full bg-black/[0.07] dark:bg-white/[0.12]">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${pct}%`, background: meta.hex }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card>
              <CardHead
                title="Leave trend"
                sub={`Approved leave days across ${currentYear}`}
                className="mb-1"
              />
              {hasTrend ? (
                /* The dashboard's leave trend chart, reading one person's
                   record instead of the company's: same component, same marks,
                   same tooltip. Only the unit differs - an employee record
                   counts days where the dashboard counts requests. */
                <LeaveTrendChart
                  data={monthlyData}
                  accent={accent}
                  unit={{ one: "day", many: "days" }}
                />
              ) : (
                <EmptyNote
                  icon={ChartBarIcon}
                  title="No leave recorded"
                  body={`Nothing on record for ${currentYear} yet.`}
                />
              )}
            </Card>

            <Card className="!mb-0">
              <CardHead
                title="Distribution"
                sub="Days taken, by leave type"
                className="mb-1"
              />
              {distribution.length > 0 ? (
                <div className="flex flex-col items-center gap-3 pb-1">
                  <div className="h-36 w-36">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={distribution}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={44}
                          outerRadius={64}
                          paddingAngle={3}
                          stroke="none"
                        >
                          {distribution.map((d, i) => (
                            <Cell key={i} fill={d.hex} />
                          ))}
                        </Pie>
                        <Tooltip
                          cursor={false}
                          content={({ active, payload }: any) => {
                            if (!active || !payload?.length) return null;
                            const slice = payload[0];
                            return (
                              <TooltipCard title={slice.name}>
                                <p className="text-gray-500 dark:text-gray-400">
                                  {slice.value}{" "}
                                  {slice.value === 1 ? "day" : "days"} taken
                                </p>
                              </TooltipCard>
                            );
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Named as well as coloured, so the split survives a
                      greyscale print and a colourblind reader. */}
                  <ul className="flex flex-wrap justify-center gap-x-3 gap-y-1.5">
                    {distribution.map((d) => (
                      <li
                        key={d.name}
                        className="flex items-center gap-1.5 text-[12px] text-gray-500 dark:text-gray-400"
                      >
                        <span
                          aria-hidden="true"
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: d.hex }}
                        />
                        {d.name}
                        <span className="font-bold tabular-nums text-gray-900 dark:text-white">
                          {d.value}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <EmptyNote
                  icon={ChartPieIcon}
                  title="No leave taken yet"
                  body="Distribution appears once leave is used."
                />
              )}
            </Card>
          </>
        )}

        {/* ---- Late ---- */}
        {tab === "late" && (
          <>
            <Card>
              <CardHead
                title="Late hours"
                sub={
                  cutoff
                    ? `From ${cutoff}${
                        latePolicy?.graceMinutes
                          ? ` plus ${latePolicy.graceMinutes}m grace`
                          : ""
                      } · ${lateRangeLabel}`
                    : lateRangeLabel
                }
                className="mb-3"
                action={
                  lateSummary && lateSummary.daysConsidered > 0 ? (
                    <span className="whitespace-nowrap rounded-full border border-black/[0.06] bg-black/[0.035] px-2.5 py-1 text-[10.5px] text-gray-500 dark:border-white/[0.07] dark:bg-white/[0.05] dark:text-gray-400">
                      {lateSummary.onTimeDays} / {lateSummary.daysConsidered} on
                      time
                    </span>
                  ) : undefined
                }
              />

              {lateLoading ? (
                <div className="grid grid-cols-2 gap-2">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className={`h-20 animate-pulse rounded-[10px] bg-black/[0.05] dark:bg-white/[0.06] ${
                        i === 0 ? "col-span-2" : ""
                      }`}
                    />
                  ))}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <StatWell
                      wide
                      large
                      tone={LATE_INK}
                      value={lateSummary?.totalLateDisplay || "0m"}
                      label="Total late hours"
                    />
                    <StatWell
                      tone={LATE_INK}
                      value={lateSummary?.totalLateMinutes ?? 0}
                      label="Late minutes"
                    />
                    <StatWell
                      tone={LATE_INK}
                      value={lateSummary?.lateDays ?? 0}
                      label="Late days"
                    />
                  </div>
                  <p className="mt-3 text-[10.5px] leading-relaxed text-gray-400 dark:text-gray-500">
                    An attendance figure only. Late minutes are not deducted
                    from a leave balance.
                  </p>
                </>
              )}
            </Card>

            <Card className="!mb-0">
              <CardHead
                title="Late log"
                sub={cutoff ? `Expected ${cutoff}` : undefined}
                className="mb-1.5"
              />
              {lateLoading ? (
                <div className="space-y-2 py-2">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-10 animate-pulse rounded-lg bg-black/[0.05] dark:bg-white/[0.06]"
                    />
                  ))}
                </div>
              ) : lateEntries.length === 0 ? (
                <EmptyNote
                  icon={ClockIcon}
                  title="No late arrivals"
                  body={`Nothing recorded in the ${lateRangeLabel}.`}
                />
              ) : (
                <>
                  {lateEntries.map((entry) => (
                    <div
                      key={entry.date}
                      className="flex items-center justify-between gap-3 border-b border-black/5 py-[11px] last:border-b-0 dark:border-white/[0.07]"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[12.5px] font-semibold text-gray-900 dark:text-gray-100">
                          {entry.dateDisplay}
                        </p>
                        <p className="mt-0.5 truncate text-[10.5px] tabular-nums text-gray-400 dark:text-gray-500">
                          Punch in {entry.punchInDisplay}
                        </p>
                      </div>
                      <span
                        className="flex-none text-[13px] font-bold"
                        style={{ color: LATE_INK }}
                      >
                        {entry.lateDisplay}
                      </span>
                    </div>
                  ))}
                  <div className="mt-3 flex items-center justify-between gap-3 border-t border-black/5 pt-3 text-[13px] font-bold dark:border-white/[0.07]">
                    <span className="text-gray-900 dark:text-gray-100">
                      Total late
                    </span>
                    <span style={{ color: LATE_INK }}>
                      {lateSummary?.totalLateDisplay || "0m"}
                    </span>
                  </div>
                </>
              )}
            </Card>
          </>
        )}

        {/* ---- History ---- */}
        {tab === "history" && (
          <>
            <Card>
              <CardHead
                title="Leave history"
                sub={`${leaveHistory.length} ${
                  leaveHistory.length === 1 ? "request" : "requests"
                } on record`}
                className={leaveHistory.length ? "mb-1.5" : "mb-1"}
              />
              {leaveHistory.length ? (
                <div className="max-h-[22rem] overflow-y-auto">
                  {leaveHistory.map((leave: any) => (
                    <div
                      key={leave._id}
                      className="flex items-start justify-between gap-2.5 border-b border-black/5 py-3 last:border-b-0 dark:border-white/[0.07]"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[12.5px] font-semibold capitalize text-gray-900 dark:text-gray-100">
                          {leave.leaveType} leave
                          <span className="ms-1.5 font-normal tabular-nums text-gray-400">
                            {leave.totalDays || 1}
                            {leave.totalDays === 1 ? " day" : " days"}
                          </span>
                        </p>
                        <p className="mt-0.5 truncate text-[10.5px] text-gray-400 dark:text-gray-500">
                          {formatDate(leave.startDate)} -{" "}
                          {formatDate(leave.endDate)}
                        </p>
                      </div>
                      <span
                        className={`flex-none rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${statusChip(
                          leave.status
                        )}`}
                      >
                        {leave.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyNote
                  icon={CalendarDaysIcon}
                  title="No leave history"
                  body="This employee has not submitted any leave requests yet."
                />
              )}
            </Card>

            {/* Every request, filterable by year and status. Same component
                the desktop page uses, so the counts cannot disagree. */}
            <EmployeeLeaveActivity employeeId={employee._id} variant="mobile" />
          </>
        )}
      </div>
    </div>
  );
};

export default MobileEmployeeDetail;
