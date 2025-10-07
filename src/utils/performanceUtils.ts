// Performance evaluation logic for attendance cards

export interface PerformanceLevel {
  level: "perfect" | "excellent" | "good" | "poor" | "critical";
  color: "green" | "yellow" | "red";
  text: string;
  description: string;
}

export const getLateMinsPerformance = (
  lateMinutes: number
): PerformanceLevel => {
  if (lateMinutes < 10) {
    return {
      level: "excellent",
      color: "green",
      text: "Excellent",
      description: "Outstanding punctuality",
    };
  } else if (lateMinutes <= 100) {
    return {
      level: "good",
      color: "yellow",
      text: "Good",
      description: "Acceptable lateness",
    };
  } else {
    return {
      level: "poor",
      color: "red",
      text: "Poor",
      description: "Needs improvement",
    };
  }
};

export const getAbsentDaysPerformance = (
  absentDays: number
): PerformanceLevel => {
  // Handle zero or negative absent days
  if (absentDays <= 0) {
    return {
      level: "excellent",
      color: "green",
      text: "Perfect",
      description: "Perfect attendance",
    };
  } else if (absentDays === 1) {
    return {
      level: "excellent",
      color: "green",
      text: "Excellent",
      description: "Minimal absence",
    };
  } else if (absentDays <= 3) {
    return {
      level: "good",
      color: "yellow",
      text: "Good",
      description: "Acceptable absence",
    };
  } else if (absentDays <= 5) {
    return {
      level: "poor",
      color: "red",
      text: "Poor",
      description: "High absenteeism",
    };
  } else {
    return {
      level: "poor",
      color: "red",
      text: "Critical",
      description: "Excessive absence",
    };
  }
};

export const getPresentDaysPerformance = (
  presentDays: number,
  totalDays: number
): PerformanceLevel => {
  const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

  if (attendanceRate >= 95) {
    return {
      level: "excellent",
      color: "green",
      text: "Excellent",
      description: "Outstanding attendance",
    };
  } else if (attendanceRate >= 85) {
    return {
      level: "good",
      color: "yellow",
      text: "Good",
      description: "Solid attendance",
    };
  } else if (attendanceRate >= 75) {
    return {
      level: "poor",
      color: "red",
      text: "Poor",
      description: "Below average",
    };
  } else {
    return {
      level: "critical",
      color: "red",
      text: "Critical",
      description: "Very poor attendance",
    };
  }
};

export const getLateDaysPerformance = (
  lateDays: number,
  totalDays: number
): PerformanceLevel => {
  const lateRate = totalDays > 0 ? (lateDays / totalDays) * 100 : 0;

  if (lateDays === 0) {
    return {
      level: "excellent",
      color: "green",
      text: "Perfect",
      description: "Never late",
    };
  } else if (lateRate <= 10) {
    return {
      level: "excellent",
      color: "green",
      text: "Excellent",
      description: "Rarely late",
    };
  } else if (lateRate <= 25) {
    return {
      level: "good",
      color: "yellow",
      text: "Good",
      description: "Occasionally late",
    };
  } else if (lateRate <= 40) {
    return {
      level: "poor",
      color: "red",
      text: "Poor",
      description: "Frequently late",
    };
  } else {
    return {
      level: "critical",
      color: "red",
      text: "Critical",
      description: "Consistently late",
    };
  }
};

export const getCardColorClasses = (
  level: "perfect" | "excellent" | "good" | "poor" | "critical"
) => {
  const baseClasses = "p-4 rounded-lg transition-all duration-300 ease-in-out";

  switch (level) {
    case "perfect":
    case "excellent":
      return {
        cardClass: `${baseClasses} bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700`,
        titleClass: "text-green-800 dark:text-green-300",
        textClass: "text-green-900 dark:text-green-100",
        subtitleClass: "text-green-600 dark:text-green-400",
        iconClass: "text-green-500",
        hoverClass: "card-hover-excellent",
      };
    case "good":
      return {
        cardClass: `${baseClasses} bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700`,
        titleClass: "text-yellow-800 dark:text-yellow-300",
        textClass: "text-yellow-900 dark:text-yellow-100",
        subtitleClass: "text-yellow-600 dark:text-yellow-400",
        iconClass: "text-yellow-500",
        hoverClass: "card-hover-good",
      };
    case "poor":
    case "critical":
      return {
        cardClass: `${baseClasses} bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700`,
        titleClass: "text-red-800 dark:text-red-300",
        textClass: "text-red-900 dark:text-red-100",
        subtitleClass: "text-red-600 dark:text-red-400",
        iconClass: "text-red-500",
        hoverClass: "card-hover-poor",
      };
  }
};
