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
 * MobileEmployeeList
 * ------------------
 * The phone layout for Team Management, built on the same index + sheet split
 * as Leave Requests.
 *
 * The previous mobile card carried a 2x2 grid of department, position, join
 * date and status under the name - roughly 190px per person. Those four facts
 * are what you check *after* finding someone, not while scanning, so they moved
 * into the sheet and the row went to 74px.
 */

export interface EmployeeRow {
  _id: string;
  name?: string;
  email?: string;
  employeeId?: string;
  department?: string;
  position?: string;
  phone?: string | null;
  joinDate?: string;
  status?: string;
  isActive?: boolean;
  role?: string;
  profilePicture?: string | null;
}

interface Props {
  employees: EmployeeRow[];
  onRefresh: () => void;
  isRefreshing: boolean;
  /** Opens the full employee page from inside the sheet. */
  onViewProfile: (id: string) => void;
}

const STATUS_TAG: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  inactive: "bg-gray-500/10 text-gray-500 dark:text-gray-400",
};

const statusOf = (e: EmployeeRow) =>
  e.isActive === false ? "inactive" : e.status || "active";

const Fact: React.FC<{ label: string; value?: string | null }> = ({ label, value }) => (
  <div className="flex items-baseline justify-between gap-4 py-2.5">
    <span className="shrink-0 text-[13px] text-gray-500 dark:text-gray-400">{label}</span>
    <span className="min-w-0 truncate text-right text-[13px] font-semibold text-gray-900 dark:text-gray-100">
      {value || "-"}
    </span>
  </div>
);

const MobileEmployeeList: React.FC<Props> = ({
  employees,
  onRefresh,
  isRefreshing,
  onViewProfile,
}) => {
  const [selected, setSelected] = useState<EmployeeRow | null>(null);

  const activeCount = employees.filter((e) => statusOf(e) === "active").length;
  const status = statusOf(selected || ({} as EmployeeRow));

  return (
    <>
      <MobileList
        title="Team"
        status={{
          text:
            employees.length === 0
              ? "No one to show"
              : `${activeCount} of ${employees.length} active`,
          tone: activeCount === employees.length ? "clear" : "attention",
        }}
        action={{
          icon: ArrowPathIcon,
          label: "Refresh team",
          onClick: onRefresh,
          busy: isRefreshing,
        }}
        empty={{
          title: "No team members yet",
          body: "Invite someone and they will appear here once the invitation is accepted.",
        }}
        isEmpty={employees.length === 0}
      >
        {employees.map((e) => (
          <MobileRow
            key={e._id}
            title={e.name || "Unknown"}
            subtitle={`ID ${e.employeeId || "-"}`}
            tag={{
              label: statusOf(e),
              className: STATUS_TAG[statusOf(e)] || STATUS_TAG.inactive,
            }}
            flagged={statusOf(e) === "pending"}
            onClick={() => setSelected(e)}
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
                  ID {selected.employeeId || "-"}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-bold capitalize ${
                  STATUS_TAG[status] || STATUS_TAG.inactive
                }`}
              >
                {status}
              </span>
            </div>

            <div className="mt-6">
              <SheetLabel>Details</SheetLabel>
              <SheetPanel className="divide-y divide-gray-200/70 px-3.5 dark:divide-white/10">
                <Fact label="Department" value={selected.department} />
                <Fact label="Position" value={selected.position} />
                <Fact
                  label="Role"
                  value={selected.role === "admin" ? "Administrator" : "Employee"}
                />
                <Fact
                  label="Joined"
                  value={
                    selected.joinDate
                      ? new Date(selected.joinDate).toLocaleDateString()
                      : undefined
                  }
                />
              </SheetPanel>
            </div>

            <div className="mt-6">
              <SheetLabel>Contact</SheetLabel>
              <SheetPanel className="divide-y divide-gray-200/70 px-3.5 dark:divide-white/10">
                <Fact label="Email" value={selected.email} />
                {/* Shown even when empty: a missing number is why this person
                    receives no WhatsApp notifications. */}
                <Fact label="Phone" value={selected.phone} />
              </SheetPanel>
            </div>
          </>
        )}
      </MobileSheet>
    </>
  );
};

export default MobileEmployeeList;
