import React, { useState } from "react";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import {
  MobileList,
  MobileRow,
  MobileSheet,
  InitialsTile,
  SheetLabel,
  SheetPanel,
} from "../mobile/MobileList";

/**
 * MobileTeamList
 * --------------
 * The phone layout for My Team, on the same index + sheet split as Leave
 * Requests and Team Management.
 *
 * The desktop card carries an avatar, a department badge, a status line, the
 * name, the position, three meta chips and a three-column leave-quota row -
 * about 280px per person. Stacked one-per-row on a phone that is two people
 * per screen. The row keeps what you scan by (name, position, department) and
 * the sheet holds the rest.
 */

export interface TeamMember {
  _id: string;
  name?: string;
  position?: string;
  employeeId?: string;
  department?: string | { name?: string };
  status?: string;
  joinDate?: string;
  email?: string;
  phone?: string | null;
  profilePicture?: string | null;
  leaveQuota?: Record<string, number>;
}

interface Props {
  members: TeamMember[];
  onRefresh: () => void;
  isRefreshing: boolean;
  onViewProfile: (id: string) => void;
  /** Resolves a member's department to a display name. */
  deptName: (m: TeamMember) => string;
  formatJoin: (iso?: string) => string;
  formatTenure: (iso?: string) => string;
}

const STATUS_TAG: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  inactive: "bg-gray-500/10 text-gray-500 dark:text-gray-400",
};

const Fact: React.FC<{ label: string; value?: string | null }> = ({ label, value }) => (
  <div className="flex items-baseline justify-between gap-4 py-2.5">
    <span className="shrink-0 text-[13px] text-gray-500 dark:text-gray-400">{label}</span>
    <span className="min-w-0 truncate text-right text-[13px] font-semibold text-gray-900 dark:text-gray-100">
      {value || "-"}
    </span>
  </div>
);

/** One leave-type allowance, shown as a compact figure. */
const Quota: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="flex-1 px-2 text-center">
    <p className="text-[17px] font-extrabold tabular-nums leading-none text-gray-900 dark:text-white">
      {value}
    </p>
    <p className="mt-1 text-[11px] font-medium text-gray-400 dark:text-gray-500">
      {label}
    </p>
  </div>
);

const MobileTeamList: React.FC<Props> = ({
  members,
  onRefresh,
  isRefreshing,
  onViewProfile,
  deptName,
  formatJoin,
  formatTenure,
}) => {
  const [selected, setSelected] = useState<TeamMember | null>(null);

  const activeCount = members.filter((m) => m.status === "active").length;
  const statusOf = (m: TeamMember) => m.status || "active";
  const quota = selected?.leaveQuota || {};

  return (
    <>
      <MobileList
        title="My team"
        status={{
          text:
            members.length === 0
              ? "No one to show"
              : `${activeCount} of ${members.length} active`,
          tone: activeCount === members.length ? "clear" : "attention",
        }}
        action={{
          icon: ArrowPathIcon,
          label: "Refresh team",
          onClick: onRefresh,
          busy: isRefreshing,
        }}
        empty={{
          title: "No team members found",
          body: "Invite employees to get started, or try a different search or filter.",
        }}
        isEmpty={members.length === 0}
      >
        {members.map((m) => (
          <MobileRow
            key={m._id}
            title={m.name || "Unknown"}
            subtitle={m.position || "-"}
            tag={{
              label: deptName(m),
              className: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
            }}
            flagged={statusOf(m) === "pending"}
            onClick={() => setSelected(m)}
          />
        ))}
      </MobileList>

      <MobileSheet
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        footer={
          selected ? (
            <>
              <button
                onClick={() => setSelected(null)}
                className="flex-1 rounded-[13px] border border-gray-200 py-2.5 text-[13px] font-bold text-gray-600 active:bg-black/5 dark:border-white/15 dark:text-gray-300 dark:active:bg-white/10"
              >
                Close
              </button>
              <button
                onClick={() => {
                  onViewProfile(selected._id);
                  setSelected(null);
                }}
                className="flex-1 rounded-[13px] py-2.5 text-[13px] font-bold text-white active:opacity-85"
                style={{ backgroundColor: "var(--accent)" }}
              >
                View profile
              </button>
            </>
          ) : undefined
        }
      >
        {selected && (
          <>
            <div className="flex items-center gap-3">
              <InitialsTile name={selected.name} />
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-[18px] font-bold leading-tight tracking-[-0.01em] text-gray-900 dark:text-white">
                  {selected.name}
                </h3>
                <p className="mt-0.5 truncate text-[11px] tracking-wide text-gray-400 dark:text-gray-500">
                  {selected.position || "-"}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-bold capitalize ${
                  STATUS_TAG[statusOf(selected)] || STATUS_TAG.inactive
                }`}
              >
                {statusOf(selected)}
              </span>
            </div>

            <div className="mt-6">
              <SheetLabel>Details</SheetLabel>
              <SheetPanel className="divide-y divide-gray-200/70 px-3.5 dark:divide-white/10">
                <Fact label="Department" value={deptName(selected)} />
                <Fact label="Employee ID" value={selected.employeeId} />
                <Fact label="Joined" value={formatJoin(selected.joinDate)} />
                <Fact label="Tenure" value={formatTenure(selected.joinDate)} />
              </SheetPanel>
            </div>

            <div className="mt-6">
              <SheetLabel>Leave allowance</SheetLabel>
              <SheetPanel className="flex divide-x divide-gray-200/70 py-3.5 dark:divide-white/10">
                <Quota label="Annual" value={quota.annual ?? 10} />
                <Quota label="Casual" value={quota.casual ?? 10} />
                <Quota label="Sick" value={quota.sick ?? 8} />
              </SheetPanel>
            </div>

            {(selected.email || selected.phone) && (
              <div className="mt-6">
                <SheetLabel>Contact</SheetLabel>
                <SheetPanel className="divide-y divide-gray-200/70 px-3.5 dark:divide-white/10">
                  <Fact label="Email" value={selected.email} />
                  <Fact label="Phone" value={selected.phone} />
                </SheetPanel>
              </div>
            )}
          </>
        )}
      </MobileSheet>
    </>
  );
};

export default MobileTeamList;
