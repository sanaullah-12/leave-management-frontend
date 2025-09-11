import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { leavesAPI } from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";
import EmployeeLeaveActivity from "../components/EmployeeLeaveActivity";
import {
  DocumentChartBarIcon,
  ArrowDownTrayIcon,
  ArrowLeftIcon,
  CalendarDaysIcon,
  UserIcon,
  EnvelopeIcon,
  BuildingOfficeIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import "../styles/design-system.css";

interface EmployeeReportData {
  employee: any;
  searchCriteria: {
    searchTerm: string;
    dateFrom: string;
    dateTo: string;
  };
  generatedAt: string;
}

const ReportsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reportData, setReportData] = useState<EmployeeReportData | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  useEffect(() => {
    const storedData = localStorage.getItem("selectedEmployeeReport");
    if (storedData) {
      try {
        const parsedData: EmployeeReportData = JSON.parse(storedData);
        setReportData(parsedData);
      } catch (error) {
        console.error("Failed to parse report data:", error);
        navigate("/employees");
      }
    } else {
      navigate("/employees");
    }
  }, [navigate]);

  const { data: leaveBalanceData } = useQuery({
    queryKey: ["employee-leave-balance-report", reportData?.employee?._id],
    queryFn: () => leavesAPI.getLeaveBalance(reportData?.employee?._id),
    enabled: !!reportData?.employee?._id,
  });

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);

    try {
      const jsPDF = (await import("jspdf")).default;
      const html2canvas = (await import("html2canvas")).default;

      const element = document.getElementById("report-content");
      if (!element) throw new Error("Report content not found");

      const originalStyles = element.style.cssText;
      element.style.cssText = `
        ${originalStyles}
        background: white !important;
        color: #000000 !important;
        font-family: Arial, sans-serif !important;
        width: 800px !important;
        max-width: none !important;
        padding: 20px !important;
        margin: 0 !important;
      `;

      const allElements = element.querySelectorAll("*");
      const originalElementStyles: string[] = [];
      allElements.forEach((el, index) => {
        const htmlEl = el as HTMLElement;
        originalElementStyles[index] = htmlEl.style.cssText;
        if (htmlEl.tagName !== "svg" && htmlEl.tagName !== "path") {
          htmlEl.style.cssText += `
            color: #000000 !important;
            background: transparent !important;
            border-color: #cccccc !important;
            font-family: Arial, sans-serif !important;
          `;
        }
      });

      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        width: 800,
        height: element.scrollHeight,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 800,
        windowHeight: element.scrollHeight,
      });

      element.style.cssText = originalStyles;
      allElements.forEach((el, index) => {
        const htmlEl = el as HTMLElement;
        htmlEl.style.cssText = originalElementStyles[index];
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");

      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `employee-report-${reportData?.employee?.name?.replace(
        /\s+/g,
        "-"
      )}-${new Date().toISOString().split("T")[0]}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleBackToEmployees = () => {
    localStorage.removeItem("selectedEmployeeReport");
    navigate("/employees");
  };

  if (!reportData) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const { employee, searchCriteria, generatedAt } = reportData;
  const leaveBalance = leaveBalanceData?.data?.balance || {};

  return (
    <div className="min-h-screen bg-gradient-to-br rounded-3xl from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300 px-4 sm:px-6 lg:px-8 py-6">
      <div className="space-y-6 fade-in">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBackToEmployees}
              className="btn-secondary inline-flex items-center"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Employees
            </button>
            <div>
              <h1 className="text-2xl font-bold text-primary">
                Employee Report
              </h1>
              <p className="text-secondary">
                Generated on {new Date(generatedAt).toLocaleString()}
              </p>
            </div>
          </div>

          <button
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
            className="btn-primary inline-flex items-center"
          >
            {isGeneratingPDF ? (
              <>
                <LoadingSpinner size="sm" />
                <span className="ml-2">Generating...</span>
              </>
            ) : (
              <>
                <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                Download PDF
              </>
            )}
          </button>
        </div>

        {/* Report Content */}
        <div
          id="report-content"
          className="space-y-6 text-primary bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
        >
          {/* Report Header */}
          <div className="card-elevated">
            <div className="card-body">
              <div className="flex items-center mb-4">
                <DocumentChartBarIcon className="h-8 w-8 text-blue-600 dark:text-blue-400 mr-3" />
                <div>
                  <h2 className="text-xl font-bold text-primary">
                    Employee Leave Report
                  </h2>
                  <p className="text-sm text-secondary">
                    Comprehensive leave analysis and activity summary
                  </p>
                </div>
              </div>

              {(searchCriteria.searchTerm ||
                searchCriteria.dateFrom ||
                searchCriteria.dateTo) && (
                <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 mb-4 border border-blue-200 dark:border-blue-800">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                    Report Criteria:
                  </h4>
                  <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    {searchCriteria.searchTerm && (
                      <p>• Employee Filter: "{searchCriteria.searchTerm}"</p>
                    )}
                    {searchCriteria.dateFrom && (
                      <p>
                        • Report Date From:{" "}
                        {new Date(searchCriteria.dateFrom).toLocaleDateString()}
                      </p>
                    )}
                    {searchCriteria.dateTo && (
                      <p>
                        • Report Date To:{" "}
                        {new Date(searchCriteria.dateTo).toLocaleDateString()}
                      </p>
                    )}
                    {!searchCriteria.dateFrom && !searchCriteria.dateTo && (
                      <p>• Report Period: All time data</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Employee Profile */}
          <div className="card-elevated">
            <div className="card-body">
              <h3 className="text-lg font-semibold mb-4 text-primary">
                Employee Profile
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <UserIcon className="h-5 w-5 text-tertiary" />
                    <div>
                      <p className="text-sm font-medium text-secondary">
                        Full Name
                      </p>
                      <p className="font-semibold text-primary">
                        {employee.name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <EnvelopeIcon className="h-5 w-5 text-tertiary" />
                    <div>
                      <p className="text-sm font-medium text-secondary">
                        Email Address
                      </p>
                      <p className="font-semibold text-primary">
                        {employee.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <BuildingOfficeIcon className="h-5 w-5 text-tertiary" />
                    <div>
                      <p className="text-sm font-medium text-secondary">
                        Department
                      </p>
                      <p className="font-semibold text-primary">
                        {employee.department}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <UserIcon className="h-5 w-5 text-tertiary" />
                    <div>
                      <p className="text-sm font-medium text-secondary">
                        Employee ID
                      </p>
                      <p className="font-semibold text-primary">
                        {employee.employeeId}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <BuildingOfficeIcon className="h-5 w-5 text-tertiary" />
                    <div>
                      <p className="text-sm font-medium text-secondary">
                        Position
                      </p>
                      <p className="font-semibold text-primary">
                        {employee.position}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <CalendarDaysIcon className="h-5 w-5 text-tertiary" />
                    <div>
                      <p className="text-sm font-medium text-secondary">
                        Join Date
                      </p>
                      <p className="font-semibold text-primary">
                        {new Date(employee.joinDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center space-x-4">
                <span
                  className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                    employee.status === "active"
                      ? "badge-success"
                      : employee.status === "pending"
                      ? "badge-warning"
                      : "badge-error"
                  }`}
                >
                  {employee.status === "active"
                    ? "Active"
                    : employee.status === "pending"
                    ? "Pending"
                    : "Inactive"}
                </span>

                <div className="flex items-center text-sm text-secondary">
                  <ClockIcon className="h-4 w-4 mr-1" />
                  Tenure:{" "}
                  {Math.floor(
                    (new Date().getTime() -
                      new Date(employee.joinDate).getTime()) /
                      (1000 * 60 * 60 * 24 * 365.25)
                  )}{" "}
                  years
                </div>
              </div>
            </div>
          </div>

          {/* Leave Balance */}
          <div className="card-elevated">
            <div className="card-body">
              <h3 className="text-lg font-semibold mb-4 text-primary">
                Leave Balance Summary
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg bg-surface-hover">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {leaveBalance.annual?.total || 0}
                  </div>
                  <div className="text-sm font-medium text-secondary">
                    Annual Leave
                  </div>
                  <div className="text-xs mt-1 text-tertiary">
                    Remaining: {leaveBalance.annual?.remaining || 0}
                  </div>
                </div>

                <div className="text-center p-4 rounded-lg bg-surface-hover">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {leaveBalance.sick?.total || 0}
                  </div>
                  <div className="text-sm font-medium text-secondary">
                    Sick Leave
                  </div>
                  <div className="text-xs mt-1 text-tertiary">
                    Remaining: {leaveBalance.sick?.remaining || 0}
                  </div>
                </div>

                <div className="text-center p-4 rounded-lg bg-surface-hover">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {leaveBalance.casual?.total || 0}
                  </div>
                  <div className="text-sm font-medium text-secondary">
                    Casual Leave
                  </div>
                  <div className="text-xs mt-1 text-tertiary">
                    Remaining: {leaveBalance.casual?.remaining || 0}
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
                <div className="flex justify-between items-center">
                  <div className="text-center flex-1">
                    <div className="text-3xl font-bold text-primary">
                      {(leaveBalance.annual?.total || 0) +
                        (leaveBalance.sick?.total || 0) +
                        (leaveBalance.casual?.total || 0)}
                    </div>
                    <div className="text-sm font-semibold text-primary">
                      Total Leaves Allocated
                    </div>
                  </div>

                  <div className="h-12 w-px mx-6 bg-border"></div>

                  <div className="text-center flex-1">
                    <div className="text-3xl font-bold text-success">
                      {(leaveBalance.annual?.remaining || 0) +
                        (leaveBalance.sick?.remaining || 0) +
                        (leaveBalance.casual?.remaining || 0)}
                    </div>
                    <div className="text-sm font-semibold text-primary">
                      Total Leaves Remaining
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Employee Leave Activity */}
          <EmployeeLeaveActivity
            employeeId={employee._id}
            isCurrentUser={false}
            dateFilter={{
              dateFrom: searchCriteria.dateFrom,
              dateTo: searchCriteria.dateTo,
            }}
          />
        </div>

        {/* Footer */}
        <div className="card">
          <div className="card-body text-center">
            <p className="text-sm text-tertiary">
              This report was generated on{" "}
              {new Date(generatedAt).toLocaleDateString()} at{" "}
              {new Date(generatedAt).toLocaleTimeString()}
              <br />
              Generated by {user?.name} ({user?.email})
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
