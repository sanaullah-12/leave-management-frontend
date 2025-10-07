import React from "react";

interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  time: string;
  type: string;
  status: string;
  timestamp: string;
  fullTimestamp?: string;
  dateDisplay?: string;
  timeDisplay?: string;
  isLate?: boolean;
  lateMinutes?: number;
  lateDisplay?: string;
}

interface AttendanceData {
  employeeId: string;
  employeeName?: string;
  machineIp: string;
  dateRange: {
    from: string;
    to: string;
    days: number;
  };
  summary: {
    totalDays: number;
    presentDays: number;
    absentDays: number;
    totalLateMinutes: number;
    lateDays: number;
    attendanceRate: number;
    avgWorkingHours: number;
  };
  records: AttendanceRecord[];
  source?: string;
  realTime?: boolean;
  fetchedAt?: string;
  totalRecords?: number;
}

interface Employee {
  machineId: string;
  name: string;
  employeeId: string;
  department: string;
  enrolledAt: Date;
  isActive: boolean;
}

interface PDFAttendanceReportProps {
  employee: Employee;
  attendanceData: AttendanceData;
  startDate: string;
  endDate: string;
}

const PDFAttendanceReport: React.FC<PDFAttendanceReportProps> = ({
  employee,
  attendanceData,
  startDate,
  endDate,
}) => {
  // Calculate total late minutes from records
  const totalLateMinutes = attendanceData.records
    .filter((record) => record.isLate && record.lateMinutes)
    .reduce((total, record) => total + (record.lateMinutes || 0), 0);

  const avgLateMinutesPerDay =
    attendanceData.summary.presentDays > 0
      ? (totalLateMinutes / attendanceData.summary.presentDays).toFixed(1)
      : "0.0";

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "--/--/----";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div
      id="pdf-attendance-report"
      style={{
        fontFamily: "Arial, sans-serif",
        color: "#000000",
        backgroundColor: "#ffffff",
        padding: "20px",
        maxWidth: "800px",
        margin: "0 auto",
        lineHeight: "1.4",
      }}
    >
      {/* Header */}
      <div
        style={{
          textAlign: "center",
          marginBottom: "30px",
          borderBottom: "2px solid #333",
          paddingBottom: "15px",
        }}
      >
        <h1
          style={{ margin: "0 0 10px 0", fontSize: "24px", fontWeight: "bold" }}
        >
          Attendance Report
        </h1>
        <h2 style={{ margin: "0 0 5px 0", fontSize: "18px", color: "#555" }}>
          {employee.name}
        </h2>
        <p style={{ margin: "0", fontSize: "14px", color: "#666" }}>
          Employee ID: {employee.employeeId} | Department: {employee.department}
        </p>
        <p style={{ margin: "5px 0 0 0", fontSize: "12px", color: "#777" }}>
          Report Period: {formatDate(startDate)} to {formatDate(endDate)}
        </p>
      </div>

      {/* Summary Statistics */}
      <div style={{ marginBottom: "30px" }}>
        <h3 style={{ fontSize: "18px", marginBottom: "15px", color: "#333" }}>
          Summary Statistics
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "15px",
            marginBottom: "20px",
          }}
        >
          {/* Present Days */}
          <div
            style={{
              border: "1px solid #ddd",
              borderRadius: "8px",
              padding: "15px",
              backgroundColor: "#f8f9fa",
            }}
          >
            <div
              style={{ fontSize: "24px", fontWeight: "bold", color: "#28a745" }}
            >
              {attendanceData.summary.presentDays || 0}
            </div>
            <div style={{ fontSize: "14px", color: "#555" }}>Present Days</div>
            <div style={{ fontSize: "12px", color: "#777" }}>
              {attendanceData.summary.attendanceRate?.toFixed(1) || "0.0"}%
              attendance
            </div>
          </div>

          {/* Absent Days */}
          <div
            style={{
              border: "1px solid #ddd",
              borderRadius: "8px",
              padding: "15px",
              backgroundColor: "#f8f9fa",
            }}
          >
            <div
              style={{ fontSize: "24px", fontWeight: "bold", color: "#dc3545" }}
            >
              {attendanceData.summary.absentDays || 0}
            </div>
            <div style={{ fontSize: "14px", color: "#555" }}>Absent Days</div>
            <div style={{ fontSize: "12px", color: "#777" }}>
              {attendanceData.summary.totalDays > 0
                ? (
                    ((attendanceData.summary.absentDays || 0) /
                      attendanceData.summary.totalDays) *
                    100
                  ).toFixed(1)
                : "0.0"}
              % absence rate
            </div>
          </div>

          {/* Late Minutes */}
          <div
            style={{
              border: "1px solid #ddd",
              borderRadius: "8px",
              padding: "15px",
              backgroundColor: "#f8f9fa",
            }}
          >
            <div
              style={{ fontSize: "24px", fontWeight: "bold", color: "#ffc107" }}
            >
              {totalLateMinutes}
            </div>
            <div style={{ fontSize: "14px", color: "#555" }}>Late Minutes</div>
            <div style={{ fontSize: "12px", color: "#777" }}>
              Avg: {avgLateMinutesPerDay} min/day
            </div>
          </div>

          {/* Late Days */}
          <div
            style={{
              border: "1px solid #ddd",
              borderRadius: "8px",
              padding: "15px",
              backgroundColor: "#f8f9fa",
            }}
          >
            <div
              style={{ fontSize: "24px", fontWeight: "bold", color: "#fd7e14" }}
            >
              {attendanceData.summary.lateDays || 0}
            </div>
            <div style={{ fontSize: "14px", color: "#555" }}>Late Days</div>
            <div style={{ fontSize: "12px", color: "#777" }}>
              {attendanceData.summary.totalDays > 0
                ? (
                    ((attendanceData.summary.lateDays || 0) /
                      attendanceData.summary.totalDays) *
                    100
                  ).toFixed(1)
                : "0.0"}
              % late rate
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Records Table */}
      <div style={{ marginBottom: "20px" }}>
        <h3 style={{ fontSize: "18px", marginBottom: "15px", color: "#333" }}>
          Detailed Records ({attendanceData.records?.length || 0} entries)
        </h3>

        {attendanceData.records && attendanceData.records.length > 0 ? (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              border: "1px solid #ddd",
              fontSize: "12px",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#f8f9fa" }}>
                <th
                  style={{
                    border: "1px solid #ddd",
                    padding: "10px",
                    textAlign: "left",
                    fontWeight: "bold",
                  }}
                >
                  Date
                </th>
                <th
                  style={{
                    border: "1px solid #ddd",
                    padding: "10px",
                    textAlign: "left",
                    fontWeight: "bold",
                  }}
                >
                  Time
                </th>
                <th
                  style={{
                    border: "1px solid #ddd",
                    padding: "10px",
                    textAlign: "left",
                    fontWeight: "bold",
                  }}
                >
                  Type
                </th>
                <th
                  style={{
                    border: "1px solid #ddd",
                    padding: "10px",
                    textAlign: "left",
                    fontWeight: "bold",
                  }}
                >
                  Status
                </th>
                <th
                  style={{
                    border: "1px solid #ddd",
                    padding: "10px",
                    textAlign: "left",
                    fontWeight: "bold",
                  }}
                >
                  Late Info
                </th>
              </tr>
            </thead>
            <tbody>
              {attendanceData.records.map((record, index) => (
                <tr
                  key={index}
                  style={{
                    backgroundColor: index % 2 === 0 ? "#ffffff" : "#f8f9fa",
                  }}
                >
                  <td
                    style={{
                      border: "1px solid #ddd",
                      padding: "8px",
                    }}
                  >
                    {record.dateDisplay || formatDate(record.date)}
                  </td>
                  <td
                    style={{
                      border: "1px solid #ddd",
                      padding: "8px",
                    }}
                  >
                    {record.timeDisplay || record.time}
                  </td>
                  <td
                    style={{
                      border: "1px solid #ddd",
                      padding: "8px",
                    }}
                  >
                    <span
                      style={{
                        padding: "2px 6px",
                        borderRadius: "4px",
                        fontSize: "11px",
                        backgroundColor:
                          record.type === "Check In" ? "#d4edda" : "#f8d7da",
                        color:
                          record.type === "Check In" ? "#155724" : "#721c24",
                      }}
                    >
                      {record.type}
                    </span>
                  </td>
                  <td
                    style={{
                      border: "1px solid #ddd",
                      padding: "8px",
                    }}
                  >
                    {record.status}
                  </td>
                  <td
                    style={{
                      border: "1px solid #ddd",
                      padding: "8px",
                    }}
                  >
                    {record.isLate ? (
                      <span
                        style={{
                          padding: "2px 6px",
                          borderRadius: "4px",
                          fontSize: "11px",
                          backgroundColor: "#fff3cd",
                          color: "#856404",
                        }}
                      >
                        Late (
                        {record.lateDisplay || `${record.lateMinutes} min`})
                      </span>
                    ) : (
                      <span
                        style={{
                          padding: "2px 6px",
                          borderRadius: "4px",
                          fontSize: "11px",
                          backgroundColor: "#d4edda",
                          color: "#155724",
                        }}
                      >
                        On Time
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div
            style={{
              textAlign: "center",
              padding: "40px",
              color: "#666",
              border: "1px solid #ddd",
              borderRadius: "8px",
              backgroundColor: "#f8f9fa",
            }}
          >
            No attendance records found for the selected date range.
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: "30px",
          paddingTop: "15px",
          borderTop: "1px solid #ddd",
          textAlign: "center",
          fontSize: "12px",
          color: "#777",
        }}
      >
        <p style={{ margin: "0" }}>
          Report generated on{" "}
          {new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
        <p style={{ margin: "5px 0 0 0" }}>
          Leave Management System • Attendance Report
        </p>
      </div>
    </div>
  );
};

export default PDFAttendanceReport;
