import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { PayrollProvider } from "../../components/payroll/PayrollProvider";

/**
 * Route-level shell for `/payroll/*`.
 *
 * Mounts {@link PayrollProvider} once above all six payroll screens so they
 * share a single store, a single employee fetch and a single set of computed
 * figures — navigating between Dashboard, Salaries and Processing is instant
 * and never recomputes payroll.
 *
 * It also owns the module's authorization boundary: payroll is admin-only, and
 * enforcing that here means no individual page has to remember to check.
 */
const PayrollLayout: React.FC = () => {
  const { user } = useAuth();

  if (user && user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return (
    <PayrollProvider>
      <Outlet />
    </PayrollProvider>
  );
};

export default PayrollLayout;
