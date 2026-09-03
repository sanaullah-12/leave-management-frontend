import React, { useState, useEffect, useMemo, useRef } from "react";
import AppLogo from "../components/AppLogo";
import DatePicker from "../components/ui/DatePicker";
import { useThemeAccent } from "../hooks/useThemeAccent";
import { CARD } from "../lib/surfaces";
import { AccentEdge } from "../components/ui/CardAccents";
import AttendanceSummary from "../components/attendance/AttendanceSummary";
import AttendanceOverview from "../components/attendance/AttendanceOverview";
import DeviceSettingsPanel from "../components/attendance/DeviceSettingsPanel";
import EmployeeTable from "../components/attendance/EmployeeTable";
import EmployeeDrawer from "../components/attendance/EmployeeDrawer";
import {
  CheckCircleIcon,
  ArrowPathIcon,
  ServerIcon,
  XCircleIcon,
  Cog6ToothIcon,
  ArrowDownTrayIcon,
  UserGroupIcon,
  ClockIcon,
  LockOpenIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";
import { attendanceAPI } from "../services/api";
import AttendanceModal from "../components/AttendanceModal";
import "../styles/design-system.css";

interface MachineConnection {
  ip: string;
  port: number;
  status: "connected" | "failed" | "not_attempted";
  connectedAt?: Date;
  lastPing?: Date;
  error?: string;
  lastAttempt?: Date;
}

interface Employee {
  machineId: string;
  name: string;
  employeeId: string; // Now uses UserID for accurate attendance correlation
  cardNumber?: string | null; // Separate card number field
  department: string;
  enrolledAt: Date;
  isActive: boolean;
  idMapping?: {
    uid: string | number;
    userId?: string | number; // Added UserID field
    cardno?: string | number | null;
    source: string;
  };
}

type LateTimePolicy = "flexible" | "strict" | "custom";

interface LateTimeSettings {
  useCustomCutoff: boolean;
  cutoffTime: string;
  policy?: LateTimePolicy;
  flexibleCutoff?: string;
  strictCutoff?: string;
  effectiveCutoffTime?: string;
  machineDefault?: boolean;
  description?: string;
}

/** "09:15" -> "9:15 AM". The API speaks 24h; the office reads 12h. */
const formatCutoff = (hhmm?: string) => {
  if (!hhmm) return "";
  const [h, m] = hhmm.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm;
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
};

/** Time ranges offered above the chart, in days back from today. */
const RANGE_PRESETS = [
  { label: "7D", days: 7 },
  { label: "1M", days: 30 },
  { label: "3M", days: 90 },
  { label: "1Y", days: 365 },
];

const AttendancePage: React.FC = () => {
  const [selectedIP, setSelectedIP] = useState("192.168.1.201");
  const [customIP, setCustomIP] = useState("");

  // User authentication state
  const [currentUser] = useState(() => {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [machineStatus, setMachineStatus] = useState<MachineConnection | null>(
    null
  );

  // Remote door unlock state
  const [isUnlockingDoor, setIsUnlockingDoor] = useState(false);
  const [doorMessage, setDoorMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  // Countdown (seconds) shown while the door is held open.
  const [doorCountdown, setDoorCountdown] = useState(0);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  // Employee-related state
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isFetchingEmployees, setIsFetchingEmployees] = useState(false);
  const [_selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );

  const [_isFetchingAttendance, setIsFetchingAttendance] = useState(false);

  // Settings state
  const [lateTimeSettings, setLateTimeSettings] = useState<LateTimeSettings>({
    useCustomCutoff: false,
    cutoffTime: "09:00",
    policy: "flexible",
    flexibleCutoff: "09:15",
    strictCutoff: "09:30",
  });

  // Which rule the CURRENTLY DISPLAYED figures were calculated with. Null means
  // "whatever the admin set", which is the official answer. Choosing the other
  // one re-queries the server; it never changes the stored policy.
  const [viewPolicy, setViewPolicy] = useState<"flexible" | "strict" | null>(
    null
  );

  const themeAccent = useThemeAccent(600);
  const [showSettings, setShowSettings] = useState(false);
  const [showDevicePanel, setShowDevicePanel] = useState(false);
  // Organisation-wide totals for the dashboard, so it has figures before any
  // individual is chosen.
  const [orgStats, setOrgStats] = useState<any>(null);

  // Date range state for attendance fetching (DEFAULT: last 2 months)
  const [startDate, setStartDate] = useState(() => {
    // Default to 2 months ago
    const date = new Date();
    date.setMonth(date.getMonth() - 2);
    return date.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    // Default to today
    return new Date().toISOString().split("T")[0];
  });

  // Modal state
  // Retained so the existing open/close flow is untouched; the slide-over is
  // what renders now, so the centre modal stays closed.
  const [, setIsModalOpen] = useState(false);
  const [modalEmployee, setModalEmployee] = useState<Employee | null>(null);
  const [isLoadingModalData, setIsLoadingModalData] = useState(false);
  const [modalAttendanceData, setModalAttendanceData] = useState<any>(null);
  /**
   * Who the detail panel is open for.
   *
   * A ref, not state: handleEmployeeClick sets the employee and starts the fetch
   * in the same tick, so the state value the fetch callback closes over is still
   * the previous one. Comparing against that stale value discarded every first
   * response and left the panel empty.
   */
  const openEmployeeRef = useRef<string | null>(null);

  // Employee inline attendance state

  // Predefined machine IPs based on your configuration

  // Load machine status on mount. Admin-only on the server, so asking as an
  // employee is a guaranteed 403 - a failed request and a console error on
  // every page load for everyone who is not an admin.
  useEffect(() => {
    if (selectedIP && (!currentUser || currentUser.role === "admin")) {
      loadMachineStatus(selectedIP);
    }
  }, [selectedIP, currentUser]);

  // Load late time settings
  useEffect(() => {
    loadLateTimeSettings();
    loadViewPolicyPreference();
  }, [currentUser]);

  const loadMachineStatus = async (ip: string) => {
    try {
      const response = await attendanceAPI.getMachineStatus(ip);
      setMachineStatus(response.data.machine);

      // If machine is connected, automatically fetch employees
      if (response.data.machine?.status === "connected") {
        fetchEmployees(ip);
      }
    } catch (err) {
      console.error("Failed to load machine status:", err);
    }
  };

  const loadLateTimeSettings = async () => {
    try {
      const response = await attendanceAPI.getLateTimeSettings();
      const loaded = response.data.settings || {};
      // Merge onto defaults: the time inputs are controlled, so a field the
      // server omits would turn one into an uncontrolled input mid-render.
      setLateTimeSettings((prev) => ({
        ...prev,
        ...loaded,
        policy: loaded.policy || prev.policy || "flexible",
        flexibleCutoff: loaded.flexibleCutoff || "09:15",
        strictCutoff: loaded.strictCutoff || "09:30",
        cutoffTime: loaded.cutoffTime || prev.cutoffTime || "09:00",
      }));
    } catch (err) {
      console.error("Failed to load late time settings:", err);
    }
  };


  const loadViewPolicyPreference = () => {
    try {
      const saved = localStorage.getItem(
        `attendanceViewPolicy_${currentUser?.id}`
      );
      if (saved === "flexible" || saved === "strict") setViewPolicy(saved);
    } catch (err) {
      console.error("Could not read the saved view policy:", err);
    }
  };

  // Remotely unlock the access-control door via the connected ZKTeco device.
  // Guarded against double-clicks by the isUnlockingDoor flag.
  const handleUnlockDoor = async () => {
    if (isUnlockingDoor) return; // prevent rapid repeat clicks

    const ipInUse = selectedIP === "custom" ? customIP : selectedIP;

    setIsUnlockingDoor(true);
    setDoorMessage(null);
    setDoorCountdown(0);

    try {
      const response = await attendanceAPI.unlockDoor(ipInUse || undefined);
      const data = (response as any)?.data || {};
      const seconds = data.durationSeconds || 10;

      setDoorMessage({
        type: "success",
        text:
          data.message ||
          `Door unlocked for ${seconds} seconds. It will lock automatically.`,
      });

      // Visual countdown while the relay holds the door open.
      setDoorCountdown(seconds);
      const interval = setInterval(() => {
        setDoorCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Re-enable the button only after the door has re-locked.
      setTimeout(() => {
        setIsUnlockingDoor(false);
        setDoorMessage(null);
      }, seconds * 1000);
    } catch (err: any) {
      setDoorMessage({
        type: "error",
        text:
          err?.response?.data?.message ||
          err?.message ||
          "Failed to unlock the door. Please try again.",
      });
      setIsUnlockingDoor(false);
      setDoorCountdown(0);
    }
  };

  const handleConnect = async () => {
    const ipToConnect = selectedIP === "custom" ? customIP : selectedIP;

    if (!ipToConnect) {
      setError("Please enter an IP address");
      return;
    }

    // Validate IP format
    const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
    if (!ipRegex.test(ipToConnect)) {
      setError("Please enter a valid IP address");
      return;
    }

    setIsConnecting(true);
    setError("");
    setSuccess("");

    try {
      const response = await attendanceAPI.connectToMachine(ipToConnect, 4370);

      if (response.data.success) {
        setSuccess(
          `Successfully connected to biometric machine at ${ipToConnect}:4370`
        );
        await loadMachineStatus(ipToConnect);
      } else {
        setError(response.data.message || "Connection failed");
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || "Connection failed";
      setError(errorMessage);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    const ipToDisconnect = selectedIP === "custom" ? customIP : selectedIP;

    try {
      const response = await attendanceAPI.disconnectFromMachine(
        ipToDisconnect
      );

      if (response.data.success) {
        setSuccess("Successfully disconnected from biometric machine");
        setMachineStatus(null);
        setEmployees([]);
        setSelectedEmployee(null);
      } else {
        setError(response.data.message || "Disconnect failed");
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || "Disconnect failed";
      setError(errorMessage);
    }
  };

  const fetchEmployees = async (ip: string) => {
    setIsFetchingEmployees(true);
    setError("");

    try {
      const response = await attendanceAPI.getEmployeesFromMachine(ip);

      if (response.data.success) {
        // Sort employees by UserID (employeeId) in ascending order
        const sortedEmployees = response.data.employees.sort(
          (a: Employee, b: Employee) => {
            const userIdA = parseInt(a.employeeId) || 0;
            const userIdB = parseInt(b.employeeId) || 0;
            return userIdA - userIdB;
          }
        );

        setEmployees(sortedEmployees);
        setSuccess(
          `Fetched ${response.data.count} employees from machine (sorted by UserID)`
        );
      } else {
        setError("Failed to fetch employees from machine");
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to fetch employees";
      setError(errorMessage);
    } finally {
      setIsFetchingEmployees(false);
    }
  };

  const handleEmployeeClick = async (employee: Employee) => {
    openEmployeeRef.current = String(employee.employeeId);
    setSelectedEmployee(employee);
    setModalEmployee(employee);
    setIsModalOpen(true);
    setIsLoadingModalData(true);
    setModalAttendanceData(null);
    setError("");

    try {
      // Fetch attendance data for the selected employee
      await fetchAttendanceRecords(employee, true);
      // The modal data will be set when fetchAttendanceRecords completes
    } catch (error) {
      console.error("Failed to fetch attendance for modal:", error);
    } finally {
      setIsLoadingModalData(false);
    }
  };

  const fetchAttendanceRecords = async (
    employee: Employee,
    forceSync = false,
    range?: { startDate: string; endDate: string },
    policyOverride?: "flexible" | "strict" | null
  ) => {
    // The modal carries its own from/to pickers; when it supplies a range use
    // that, otherwise fall back to the page-level filter.
    const fromDate = range?.startDate || startDate;
    const toDate = range?.endDate || endDate;
    setIsFetchingAttendance(true);

    // If modal is open for this employee, also update modal loading state
    if (modalEmployee && modalEmployee.employeeId === employee.employeeId) {
      setIsLoadingModalData(true);
    }

    setError("");

    const currentIP = selectedIP === "custom" ? customIP : selectedIP;

    try {
      // undefined here means "use the admin's saved policy", which is the
      // official result. An explicit value only re-labels this one response.
      const effectivePolicy =
        policyOverride === undefined ? viewPolicy : policyOverride;

      const response = await attendanceAPI.getEmployeeAttendance(
        currentIP,
        employee.employeeId, // FIXED: Use employeeId (UserID) instead of machineId (UID)
        fromDate,
        toDate,
        7,
        forceSync,
        effectivePolicy || undefined
      );

      if (response.data.success) {
        // Store the response only while this is still the employee on screen,
        // so a slow reply for someone the user has navigated away from cannot
        // overwrite the panel.
        if (openEmployeeRef.current === String(employee.employeeId)) {
          setModalAttendanceData(response.data);
        }

        if (forceSync) {
          setSuccess("Attendance data synchronized from machine successfully");
        }
      } else {
        setError("Failed to fetch attendance records");
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to fetch attendance records";
      setError(errorMessage);
    } finally {
      setIsFetchingAttendance(false);

      // If modal is open for this employee, also update modal loading state
      if (modalEmployee && modalEmployee.employeeId === employee.employeeId) {
        setIsLoadingModalData(false);
      }
    }
  };

  const updateLateTimeSettings = async (newSettings: LateTimeSettings) => {
    try {
      const policy = newSettings.policy || "flexible";
      const response = await attendanceAPI.updateLateTimeSettings({
        policy,
        flexibleCutoff: newSettings.flexibleCutoff,
        strictCutoff: newSettings.strictCutoff,
        cutoffTime: newSettings.cutoffTime,
      });

      if (response.data.success) {
        // Take the saved values back from the server rather than assuming the
        // form state matched what it stored.
        setLateTimeSettings((prev) => ({
          ...prev,
          ...(response.data.settings || {}),
          effectiveCutoffTime:
            policy === "strict"
              ? newSettings.strictCutoff || "09:30"
              : policy === "custom"
              ? newSettings.cutoffTime
              : newSettings.flexibleCutoff || "09:15",
        }));
        setSuccess(
          `Late time rule saved. Attendance is now measured against ${formatCutoff(
            policy === "strict"
              ? newSettings.strictCutoff || "09:30"
              : policy === "custom"
              ? newSettings.cutoffTime
              : newSettings.flexibleCutoff || "09:15"
          )}.`
        );
        setShowSettings(false);

        // Existing rows were labelled with the old rule, so re-read them.
        const target = modalEmployee || _selectedEmployee;
        if (target) fetchAttendanceRecords(target, false, undefined, viewPolicy);
      } else {
        setError("Failed to update settings");
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to update settings";
      setError(errorMessage);
    }
  };

  const handleCloseModal = () => {
    openEmployeeRef.current = null;
    setIsModalOpen(false);
    setModalEmployee(null);
    setModalAttendanceData(null);
    setIsLoadingModalData(false);
  };


  const loadOrgStats = async (from: string, to: string) => {
    try {
      const response = await attendanceAPI.getAttendanceStats(from, to);
      if (response.data?.success) setOrgStats(response.data);
    } catch (err) {
      // The dashboard degrades to dashes rather than blocking the page.
      console.error("Failed to load attendance statistics:", err);
    }
  };

  // Organisation-wide totals are admin-only on the server; see above.
  useEffect(() => {
    if (!currentUser || currentUser.role === "admin") {
      loadOrgStats(startDate, endDate);
    }
  }, [startDate, endDate, currentUser]);

  /**
   * Switch which office time the figures are measured against.
   *
   * A view only: the server recalculates from its own stored policy on every
   * request, so this cannot change anyone's official record. The choice is
   * remembered per user for convenience.
   */
  const applyViewPolicy = (policy: "flexible" | "strict" | null) => {
    setViewPolicy(policy);
    try {
      const key = `attendanceViewPolicy_${currentUser?.id}`;
      if (policy) localStorage.setItem(key, policy);
      else localStorage.removeItem(key);
    } catch {
      // A blocked localStorage must not stop the view from switching.
    }
  };

  /** Which range chip is highlighted; null when the dates were set by hand. */
  const [activeRangeDays, setActiveRangeDays] = useState<number | null>(null);

  /**
   * Move the date range and reload whoever is on screen.
   *
   * Writes the same startDate/endDate state the pickers use, so the chart, the
   * table and the pickers can never drift apart.
   */
  const applyRangePreset = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);

    const from = start.toISOString().split("T")[0];
    const to = end.toISOString().split("T")[0];

    setStartDate(from);
    setEndDate(to);
    setActiveRangeDays(days);

    const target = modalEmployee || _selectedEmployee;
    if (target) {
      fetchAttendanceRecords(target, false, { startDate: from, endDate: to });
    }
  };

  /**
   * Download the records currently on screen as CSV.
   *
   * Reads only what has already been fetched, so it exports exactly the rows
   * the reader can see, under the arrival rule they are seeing them under.
   */
  const exportRoster = () => {
    if (!overview || !overview.records.length) return;

    const header = ["Employee", "Date", "Time", "Status", "Late by"];
    const escape = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

    const rows = overview.records.map((r: any) =>
      [
        modalEmployee?.name || modalEmployee?.employeeId || "",
        r.dateDisplay || r.date,
        r.timeDisplay || r.time,
        r.isLate ? "Late" : "On time",
        r.isLate ? r.lateDisplay || "" : "",
      ]
        .map(escape)
        .join(",")
    );

    const csv = [header.map(escape).join(","), ...rows].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `attendance-${modalEmployee?.employeeId || "export"}-${
      overview.rangeLabel.replace(/\s+/g, "") || "range"
    }.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  /**
   * The figures behind the tiles and the chart.
   *
   * Derived only from the response already in state - this adds no request and
   * no calculation of its own, so the numbers are exactly what the API reported
   * under whichever arrival rule was applied.
   */
  const overview = useMemo(() => {
    const data = modalAttendanceData;
    const summary = data?.summary;
    if (!data || !summary) return null;

    const policy = data.lateTimePolicy || {};
    const cutoffTime = policy.cutoffTime || lateTimeSettings.cutoffTime;

    return {
      presentDays: summary.presentDays ?? 0,
      absentDays: summary.absentDays ?? 0,
      lateDays: summary.lateDays ?? 0,
      totalDays: summary.totalDays ?? 0,
      attendanceRate: summary.attendanceRate ?? 0,
      records: (data.records || []) as any[],
      cutoffTime,
      cutoffLabel: formatCutoff(cutoffTime),
      rangeLabel: data.dateRange
        ? `${data.dateRange.from} to ${data.dateRange.to}`
        : "",
      subjectLabel: policy.isPreview
        ? `Comparison against ${formatCutoff(cutoffTime)} - the official rule is ${formatCutoff(
            policy.officialCutoffTime
          )}`
        : `Measured against the official ${formatCutoff(cutoffTime)} arrival time`,
    };
  }, [modalAttendanceData, lateTimeSettings.cutoffTime]);

  const isAdmin = !currentUser || currentUser.role === "admin";

  /**
   * Who this page reports on.
   *
   * Admins get the device roster. An employee gets only themselves - the
   * roster endpoint is admin-only, and their own record is the only one they
   * are allowed to read anyway.
   */
  const rosterTargets = useMemo<any[]>(() => {
    if (isAdmin) return employees;
    if (!currentUser?.employeeId) return [];
    return [
      {
        employeeId: currentUser.employeeId,
        machineId: currentUser.employeeId,
        name: currentUser.name,
        department: currentUser.department,
      },
    ];
  }, [isAdmin, employees, currentUser]);

  /** employeeId -> that person's attendance response for the active range. */
  const [rosterAttendance, setRosterAttendance] = useState<Record<string, any>>({});
  const [rosterLoading, setRosterLoading] = useState(false);
  const [rosterProgress, setRosterProgress] = useState({ done: 0, total: 0 });
  /** The range and rule the loaded roster describes, or null before a fetch. */
  const [rosterFetchedFor, setRosterFetchedFor] = useState<{
    from: string;
    to: string;
    policy: string;
  } | null>(null);

  /**
   * Load every enrolled employee's records for the active range.
   *
   * The backend has no bulk read, so this walks the roster through the same
   * per-employee endpoint the detail panel uses, a few at a time. Concurrency is
   * capped because each call scans the collection server-side; firing all of
   * them at once starves the rest of the page.
   *
   * Deliberately NOT wired to an effect: at roughly a request per employee this
   * is slow enough that it has to be something the reader asks for.
   */
  const rosterRunRef = useRef(0);

  const loadRosterAttendance = async () => {
    if (!rosterTargets.length || rosterLoading) return;

    const run = ++rosterRunRef.current;
    const CONCURRENCY = 4;
    const total = rosterTargets.length;

    setRosterLoading(true);
    setRosterProgress({ done: 0, total });

    const collected: Record<string, any> = {};
    const queue = [...rosterTargets];
    let done = 0;

    const worker = async () => {
      while (queue.length && rosterRunRef.current === run) {
        const emp = queue.shift();
        if (!emp) break;
        try {
          const res = await attendanceAPI.getEmployeeAttendance(
            selectedIP === "custom" ? customIP : selectedIP,
            emp.employeeId,
            startDate,
            endDate,
            7,
            false,
            viewPolicy || undefined
          );
          if (res.data?.success) collected[String(emp.employeeId)] = res.data;
        } catch (err) {
          // One employee failing must not blank the whole table.
          console.error(`Attendance load failed for ${emp.employeeId}:`, err);
        } finally {
          done += 1;
          if (rosterRunRef.current === run) {
            setRosterProgress({ done, total });
          }
        }
      }
    };

    await Promise.all(Array.from({ length: CONCURRENCY }, worker));

    // A newer run started while this one was in flight; its results win.
    if (rosterRunRef.current !== run) return;

    setRosterAttendance(collected);
    setRosterFetchedFor({
      from: startDate,
      to: endDate,
      policy: viewPolicy || "official",
    });
    setRosterLoading(false);
  };

  /**
   * Whether what is on screen still describes the current controls.
   * Changing the range or the arrival rule does not refetch - it just says so.
   */
  const rosterStale =
    !!rosterFetchedFor &&
    (rosterFetchedFor.from !== startDate ||
      rosterFetchedFor.to !== endDate ||
      rosterFetchedFor.policy !== (viewPolicy || "official"));

  /** Per-day on-time and late counts, for the stacked chart. */
  const dayBars = useMemo(() => {
    const byDate: Record<string, { onTime: number; late: number }> = {};

    Object.values(rosterAttendance).forEach((data: any) => {
      (data?.records || []).forEach((r: any) => {
        const bucket = (byDate[r.date] ||= { onTime: 0, late: 0 });
        if (r.isLate) bucket.late += 1;
        else bucket.onTime += 1;
      });
    });

    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-14)
      .map(([date, counts]) => {
        const [y, m, d] = date.split("-").map(Number);
        // Built in UTC so the weekday cannot shift in a negative-offset browser.
        const dt = new Date(Date.UTC(y, m - 1, d));
        return {
          label: dt.toLocaleDateString(undefined, {
            timeZone: "UTC",
            weekday: "short",
          }),
          full: dt.toLocaleDateString(undefined, {
            timeZone: "UTC",
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
          ...counts,
        };
      });
  }, [rosterAttendance]);

  /** Latest punch per employee, for the roster table's time columns. */
  const rosterRows = useMemo(
    () =>
      rosterTargets.map((emp: any) => {
        const data = rosterAttendance[String(emp.employeeId)];
        const latest = data?.records?.[0] || null;
        return {
          employee: emp,
          checkIn: latest?.timeDisplay || latest?.time || null,
          lateDisplay: latest?.lateDisplay || null,
          presentDays: data?.summary?.presentDays ?? null,
          status: !data
            ? "No record"
            : latest
            ? latest.isLate
              ? "Late"
              : "On time"
            : "No record",
        };
      }),
    [rosterTargets, rosterAttendance]
  );

  /** Counts behind the summary cards and the breakdown panel. */
  const statusCounts = useMemo(() => {
    const counts = { onTime: 0, late: 0, noRecord: 0 };
    rosterRows.forEach((r) => {
      if (r.status === "Late") counts.late += 1;
      else if (r.status === "On time") counts.onTime += 1;
      else counts.noRecord += 1;
    });
    return counts;
  }, [rosterRows]);




  return (
    <div className="attendance-dashboard space-y-6 fade-in">
      {/* Page header: title, the date it describes, and the range that drives
          every figure below. */}
      <header
        className={`relative flex flex-wrap items-center justify-between gap-3 overflow-hidden ${CARD} px-5 py-4`}
      >
        <AccentEdge color={themeAccent} />
        <div className="flex items-center gap-3">
          {/* White plate so the brand mark keeps its own colours against the
              card surface, in either theme. */}
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-gray-200/70 dark:ring-gray-600/60">
            <AppLogo size={26} />
          </span>
          <div>
            <p className="text-base font-semibold tracking-tight text-gray-900 dark:text-gray-100">
              Attendance
            </p>
            <p className="text-[12.5px] text-gray-400 dark:text-gray-500">
              {new Date(endDate + "T00:00:00").toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <div className="w-[150px]">
              <DatePicker
                value={startDate}
                max={endDate}
                onChange={(next) => {
                  if (!next) return;
                  setStartDate(next);
                  // Typing a date by hand means the preset chips no longer
                  // describe what is on screen.
                  setActiveRangeDays(null);
                }}
                placeholder="Start date"
              />
            </div>
            <span className="text-sm text-gray-400">to</span>
            <div className="w-[150px]">
              <DatePicker
                value={endDate}
                min={startDate}
                onChange={(next) => {
                  if (!next) return;
                  setEndDate(next);
                  setActiveRangeDays(null);
                }}
                placeholder="End date"
              />
            </div>
          </div>

          <div className="flex gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-700/50">
            {RANGE_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => applyRangePreset(preset.days)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  activeRangeDays === preset.days
                    ? "bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-gray-100"
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-300"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Which office time this view is measured against.
              Employees only: the admin's official rule lives in Device and
              settings, and a second control beside it would read as a rival
              setting rather than a comparison. */}
          {!isAdmin && (
            <div className="flex gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-700/50">
              {[
                { key: null as null, label: "Official" },
                {
                  key: "flexible" as const,
                  label: formatCutoff(lateTimeSettings.flexibleCutoff || "09:15"),
                },
                {
                  key: "strict" as const,
                  label: formatCutoff(lateTimeSettings.strictCutoff || "09:30"),
                },
              ].map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => applyViewPolicy(option.key)}
                  title={
                    option.key
                      ? `Measure your record against ${option.label}`
                      : "Use the arrival time your administrator set"
                  }
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    viewPolicy === option.key
                      ? "bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-gray-100"
                      : "text-gray-600 hover:text-gray-900 dark:text-gray-300"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={loadRosterAttendance}
            disabled={rosterLoading || !rosterTargets.length}
            title={
              rosterTargets.length
                ? "Load attendance for the selected range"
                : "Connect to the device to load the roster first"
            }
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ArrowPathIcon
              className={`h-4 w-4 ${rosterLoading ? "animate-spin" : ""}`}
            />
            {rosterLoading
              ? `Fetching ${rosterProgress.done} of ${rosterProgress.total}`
              : rosterFetchedFor
              ? "Fetch again"
              : "Fetch attendance"}
          </button>

          {rosterStale && !rosterLoading && (
            <span className="rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
              Range changed - fetch to update
            </span>
          )}
        </div>
      </header>

      {/* Door feedback. The button that triggers it is in the toolbar below. */}
      {(!currentUser || currentUser.role === "admin") &&
        (isUnlockingDoor || doorMessage) && (
          <div
            className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm ${
              isUnlockingDoor
                ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"
                : doorMessage?.type === "success"
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                : "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"
            }`}
          >
            {isUnlockingDoor ? (
              <>
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
                <span>
                  Unlocking the door
                  {doorCountdown > 0 ? ` - ${doorCountdown}s remaining` : "..."}
                </span>
              </>
            ) : doorMessage?.type === "success" ? (
              <>
                <CheckCircleIcon className="h-4 w-4" />
                <span>{doorMessage.text}</span>
              </>
            ) : (
              <>
                <XCircleIcon className="h-4 w-4" />
                <span>{doorMessage?.text}</span>
              </>
            )}
          </div>
        )}

      {/* Summary */}
      <AttendanceSummary
        loading={rosterLoading && !Object.keys(rosterAttendance).length}
        items={[
          {
            label: isAdmin ? "Employees" : "You",
            icon: <UserGroupIcon className="h-7 w-7" />,
            value: rosterTargets.length || null,
            caption: isAdmin
              ? `Enrolled on ${selectedIP === "custom" ? customIP : selectedIP}`
              : "Your own attendance",
          },
          {
            label: "On time",
            icon: <CheckCircleIcon className="h-7 w-7" />,
            value: rosterFetchedFor ? statusCounts.onTime : null,
            accent: themeAccent,
            caption: !rosterFetchedFor
              ? "Not fetched yet"
              : rosterTargets.length
              ? `${Math.round(
                  (statusCounts.onTime / rosterTargets.length) * 100
                )}% of workforce`
              : undefined,
          },
          {
            label: "Late",
            icon: <ClockIcon className="h-7 w-7" />,
            value: rosterFetchedFor ? statusCounts.late : null,
            accent: "#b5650a",
            caption: !rosterFetchedFor
              ? "Not fetched yet"
              : rosterTargets.length
              ? `${Math.round(
                  (statusCounts.late / rosterTargets.length) * 100
                )}% of workforce`
              : undefined,
          },
          {
            label: "No record",
            icon: <XCircleIcon className="h-7 w-7" />,
            value: rosterFetchedFor ? statusCounts.noRecord : null,
            accent: "#b42318",
            caption: !rosterFetchedFor
              ? "Not fetched yet"
              : rosterTargets.length
              ? `${Math.round(
                  (statusCounts.noRecord / rosterTargets.length) * 100
                )}% of workforce`
              : undefined,
          },
          {
            label: "Punches",
            icon: <CalendarDaysIcon className="h-7 w-7" />,
            value: orgStats ? orgStats.totalRecords : null,
            accent: themeAccent,
            caption: "Recorded in this range",
          },
        ]}
      />

      {/* Overview: trend beside the current split */}
      <AttendanceOverview
        loading={rosterLoading && !dayBars.length}
        emptyMessage={
          rosterFetchedFor ? undefined : "Press Fetch attendance to load"
        }
        days={dayBars}
        chartCaption={
          rosterFetchedFor
            ? `On-time and late arrivals per day, measured against ${formatCutoff(
                lateTimeSettings.effectiveCutoffTime ||
                  lateTimeSettings.cutoffTime
              )}`
            : "Press Fetch attendance to load the workforce"
        }
        breakdownTotal={rosterTargets.length}
        breakdown={[
          { label: "On time", count: statusCounts.onTime, tone: themeAccent },
          { label: "Late", count: statusCounts.late, tone: "#b5650a" },
          { label: "No record", count: statusCounts.noRecord, tone: "#b42318" },
        ]}
      />

      {/* Toolbar */}
      <section aria-label="Actions" className="flex flex-wrap items-center gap-2">
        {isAdmin && (
        <button
          type="button"
          onClick={() => setShowDevicePanel((v) => !v)}
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
        >
          <ServerIcon className="h-4 w-4" />
          {machineStatus?.status === "connected"
            ? `Connected to ${machineStatus.ip}`
            : "Device not connected"}
        </button>
        )}

        <div className="flex-1" />

        {isAdmin && (
          <>
            <button
              type="button"
              onClick={handleUnlockDoor}
              disabled={isUnlockingDoor}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
            >
              <LockOpenIcon className="h-4 w-4" />
              Unlock door
            </button>
            <button
              type="button"
              onClick={() => {
                setShowDevicePanel(true);
                setShowSettings(true);
              }}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
            >
              <Cog6ToothIcon className="h-4 w-4" />
              Late time
            </button>
          </>
        )}
        {isAdmin && (
        <button
          type="button"
          onClick={() =>
            fetchEmployees(selectedIP === "custom" ? customIP : selectedIP)
          }
          disabled={isFetchingEmployees}
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
        >
          <ArrowPathIcon
            className={`h-4 w-4 ${isFetchingEmployees ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
        )}
        <button
          type="button"
          onClick={exportRoster}
          disabled={!rosterRows.length}
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
        >
          <ArrowDownTrayIcon className="h-4 w-4" />
          Export
        </button>
      </section>

      <DeviceSettingsPanel
        open={isAdmin && (showDevicePanel || showSettings)}
        onClose={() => {
          setShowDevicePanel(false);
          setShowSettings(false);
        }}
        ip={selectedIP === "custom" ? customIP : selectedIP}
        onIpChange={(next) => {
          setSelectedIP("custom");
          setCustomIP(next);
        }}
        connected={machineStatus?.status === "connected"}
        connecting={isConnecting}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
        statusText={error || success || undefined}
        settings={lateTimeSettings}
        onSettingsChange={setLateTimeSettings}
        onSaveSettings={() => updateLateTimeSettings(lateTimeSettings)}
        canEditSettings={!currentUser || currentUser.role === "admin"}
        formatCutoff={formatCutoff}
      />

      {/* Roster */}
      <EmployeeTable
        showFilters={isAdmin}
        rows={rosterRows as any}
        loading={isFetchingEmployees || rosterLoading}
        onSelect={(emp) => handleEmployeeClick(emp as any)}
      />

      {/* Employee detail panel */}
      {modalEmployee && (
        <EmployeeDrawer
          employee={modalEmployee as any}
          data={modalAttendanceData}
          loading={isLoadingModalData}
          onClose={handleCloseModal}
        />
      )}

      {/* Attendance Modal */}
      <AttendanceModal
        isOpen={false}
        onClose={handleCloseModal}
        employee={modalEmployee}
        data={modalAttendanceData}
        isLoading={isLoadingModalData}
        defaultStartDate={startDate}
        defaultEndDate={endDate}
        onFetchRecords={(employee, forceRefresh, range) =>
          fetchAttendanceRecords(employee, forceRefresh ?? false, range)
        }
      />
    </div>
  );
};

export default AttendancePage;
