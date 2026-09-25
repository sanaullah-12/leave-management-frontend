import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import TimeChangeRequestModal, {
  type TimeChangeDay,
} from "../components/attendance/TimeChangeRequestModal";
import { useAuth } from "../context/AuthContext";

/**
 * One Request Time Change form for the whole signed-in app.
 *
 * A late day is shown on the attendance page and its phone tabs, the day and
 * full-record panels, the dashboard, the late time report and the time change
 * page. Each of those offers the request next to the late time, and all of
 * them open this one form, so who may ask and what the form starts from are
 * decided here and nowhere else.
 */

interface TimeChangeRequester {
  /** Whether the signed-in person raises requests for their own late days. */
  canRequest: boolean;
  /** The signed-in person's device code: the only days a request can be about. */
  employeeCode: string | null;
  requestTimeChange: (day: TimeChangeDay) => void;
}

const TimeChangeContext = createContext<TimeChangeRequester>({
  canRequest: false,
  employeeCode: null,
  requestTimeChange: () => {},
});

export const TimeChangeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [day, setDay] = useState<TimeChangeDay | null>(null);

  const employeeCode = user?.employeeId ? String(user.employeeId) : null;
  // An admin decides requests rather than raising them, and has no own days
  // listed on the attendance page to raise one from.
  const canRequest = Boolean(employeeCode) && user?.role !== "admin";

  const requestTimeChange = useCallback(
    (next: TimeChangeDay) => {
      if (canRequest) setDay(next);
    },
    [canRequest]
  );

  const value = useMemo(
    () => ({ canRequest, employeeCode, requestTimeChange }),
    [canRequest, employeeCode, requestTimeChange]
  );

  return (
    <TimeChangeContext.Provider value={value}>
      {children}
      <TimeChangeRequestModal day={day} onClose={() => setDay(null)} />
    </TimeChangeContext.Provider>
  );
};

export const useTimeChangeRequest = () => useContext(TimeChangeContext);
