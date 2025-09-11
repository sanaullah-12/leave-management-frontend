import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { leavesAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";
import {
  CogIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CalendarDaysIcon,
  HeartIcon,
  BriefcaseIcon,
} from "@heroicons/react/24/outline";
import "../styles/design-system.css";

interface LeavePolicy {
  casual: number;
  sick: number;
  annual: number;
  maternity?: number;
  paternity?: number;
  emergency?: number;
}

const LeavePolicyPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editPolicy, setEditPolicy] = useState<LeavePolicy>({
    casual: 10,
    sick: 8,
    annual: 10,
    maternity: 90,
    paternity: 15,
    emergency: 3,
  });

  // Fetch current policy
  const { data: policyData, isLoading } = useQuery({
    queryKey: ["leave-policy"],
    queryFn: () => leavesAPI.getLeavePolicy(),
    retry: 1,
  });

  // Update policy mutation
  const updatePolicyMutation = useMutation({
    mutationFn: (policy: LeavePolicy) => leavesAPI.updateLeavePolicy(policy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-policy"] });
      setIsEditing(false);
    },
  });

  if (user?.role !== "admin") {
    return (
      <div className="text-center py-8">
        <p style={{ color: "var(--text-secondary)" }}>
          Access denied. Admin privileges required.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const currentPolicy = policyData?.data || {
    casual: 10,
    sick: 8,
    annual: 10,
    maternity: 90,
    paternity: 15,
    emergency: 3,
  };

  const handleStartEdit = () => {
    setEditPolicy(currentPolicy);
    setIsEditing(true);
  };

  const handleSavePolicy = () => {
    updatePolicyMutation.mutate(editPolicy);
  };

  const handleCancelEdit = () => {
    setEditPolicy(currentPolicy);
    setIsEditing(false);
  };

  const leaveTypes = [
    {
      key: "casual" as keyof LeavePolicy,
      name: "Casual Leave",
      icon: CalendarDaysIcon,
      color: "text-blue-500",
      bgColor: "bg-blue-100 dark:bg-blue-900",
      description: "Personal time off for casual activities",
    },
    {
      key: "sick" as keyof LeavePolicy,
      name: "Sick Leave",
      icon: HeartIcon,
      color: "text-red-500",
      bgColor: "bg-red-100 dark:bg-red-900",
      description: "Medical leave for illness or health issues",
    },
    {
      key: "annual" as keyof LeavePolicy,
      name: "Annual Leave",
      icon: BriefcaseIcon,
      color: "text-green-500",
      bgColor: "bg-green-100 dark:bg-green-900",
      description: "Yearly vacation and holiday leave",
    },
  ];

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            Leave Policy Management
          </h1>
          <p style={{ color: "var(--text-secondary)" }}>
            Configure company-wide leave allocation policies
          </p>
        </div>

        <div className="flex space-x-3">
          {isEditing ? (
            <>
              <button
                onClick={handleSavePolicy}
                disabled={updatePolicyMutation.isPending}
                className="btn-success inline-flex items-center"
              >
                {updatePolicyMutation.isPending ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <CheckCircleIcon className="h-5 w-5 mr-2" />
                )}
                Save Changes
              </button>
              <button onClick={handleCancelEdit} className="btn-secondary">
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={handleStartEdit}
              className="btn-primary inline-flex items-center"
            >
              <CogIcon className="h-5 w-5 mr-2" />
              Edit Policy
            </button>
          )}
        </div>
      </div>

      {/* Policy Overview */}
      <div className="card-elevated">
        <div className="card-header">
          <div>
            <h2
              className="text-xl font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Current Leave Policy
            </h2>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Annual leave allocations for all employees
            </p>
          </div>
        </div>

        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {leaveTypes.map((leaveType) => {
              const IconComponent = leaveType.icon;
              const currentValue = currentPolicy[leaveType.key] || 0;
              const editValue = editPolicy[leaveType.key] || 0;

              return (
                <div key={leaveType.key} className="stats-card hover-lift">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-xl ${leaveType.bgColor}`}>
                        <IconComponent
                          className={`h-8 w-8 ${leaveType.color}`}
                        />
                      </div>
                      <div className="text-right">
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            max="365"
                            value={editValue}
                            onChange={(e) =>
                              setEditPolicy((prev) => ({
                                ...prev,
                                [leaveType.key]: parseInt(e.target.value) || 0,
                              }))
                            }
                            className="input-field w-20 text-center"
                          />
                        ) : (
                          <span
                            className="text-3xl font-bold"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {currentValue}
                          </span>
                        )}
                        <p
                          className="text-sm"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          days/year
                        </p>
                      </div>
                    </div>

                    <h3
                      className="font-semibold mb-2"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {leaveType.name}
                    </h3>
                    <p
                      className="text-sm"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {leaveType.description}
                    </p>

                    {isEditing && editValue !== currentValue && (
                      <div className="mt-3 p-2 rounded-md bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700">
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          {editValue > currentValue ? "↑" : "↓"} Change:{" "}
                          {currentValue} → {editValue} days
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {isEditing && (
            <div
              className="mt-8 p-6 rounded-xl border-2 border-dashed"
              style={{ borderColor: "var(--border-color)" }}
            >
              <div className="flex items-start space-x-3">
                <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500 mt-1 flex-shrink-0" />
                <div>
                  <h3
                    className="font-semibold mb-2"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Policy Update Impact
                  </h3>
                  <div
                    className="space-y-1 text-sm"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    <p>
                      • New policy will apply to all employees from the next
                      allocation cycle
                    </p>
                    <p>
                      • Current year allocations for existing employees will
                      remain unchanged
                    </p>
                    <p>
                      • New employees will receive allocations based on the
                      updated policy
                    </p>
                    <p>
                      • Individual employee allocations can be modified
                      separately if needed
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Policy Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header">
              <h3
                className="text-lg font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                Policy Comparison
              </h3>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Compare current policy with industry standards
              </p>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                {[
                  {
                    type: "Casual Leave",
                    current: currentPolicy.casual,
                    industry: "10-15",
                    status: currentPolicy.casual >= 10 ? "good" : "low",
                  },
                  {
                    type: "Sick Leave",
                    current: currentPolicy.sick,
                    industry: "8-12",
                    status: currentPolicy.sick >= 8 ? "good" : "low",
                  },
                  {
                    type: "Annual Leave",
                    current: currentPolicy.annual,
                    industry: "10-20",
                    status: currentPolicy.annual >= 10 ? "good" : "low",
                  },
                ].map((item) => (
                  <div
                    key={item.type}
                    className="flex items-center justify-between p-3 rounded-lg border"
                    style={{ borderColor: "var(--border-color)" }}
                  >
                    <div>
                      <p
                        className="font-medium"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {item.type}
                      </p>
                      <p
                        className="text-sm"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Industry: {item.industry} days
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span
                        className="text-lg font-bold"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {item.current} days
                      </span>
                      <span
                        className={`badge ${
                          item.status === "good"
                            ? "badge-success"
                            : "badge-warning"
                        }`}
                      >
                        {item.status === "good"
                          ? "Competitive"
                          : "Below Average"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h3
                className="text-lg font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                Quick Stats
              </h3>
            </div>
            <div className="card-body space-y-4">
              <div className="text-center">
                <p
                  className="text-3xl font-bold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {Object.values(currentPolicy).reduce(
                    (sum: number, val: any) => sum + (val || 0),
                    0
                  )}
                </p>
                <p
                  className="text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Total Annual Days
                </p>
              </div>

              <div
                className="border-t pt-4"
                style={{ borderColor: "var(--border-color)" }}
              >
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span style={{ color: "var(--text-secondary)" }}>
                      Most Allocated
                    </span>
                    <span style={{ color: "var(--text-primary)" }}>
                      {currentPolicy.maternity
                        ? "Maternity (90d)"
                        : "Annual (10d)"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: "var(--text-secondary)" }}>
                      Least Allocated
                    </span>
                    <span style={{ color: "var(--text-primary)" }}>
                      Emergency ({currentPolicy.emergency || 3}d)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeavePolicyPage;
