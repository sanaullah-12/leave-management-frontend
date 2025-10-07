import React from "react";

interface TooltipProps {
  text: string;
  level: "perfect" | "excellent" | "good" | "poor" | "critical";
  visible: boolean;
}

const TooltipComponent: React.FC<TooltipProps> = ({ text, level, visible }) => {
  console.log("Tooltip Debug:", { text, level, visible });

  if (!visible) return null;

  const getTooltipStyle = () => {
    let bgColor = "bg-gray-600";
    let borderColor = "border-t-gray-600";

    switch (level) {
      case "perfect":
      case "excellent":
        bgColor = "bg-green-600";
        borderColor = "border-t-green-600";
        break;
      case "good":
        bgColor = "bg-yellow-600";
        borderColor = "border-t-yellow-600";
        break;
      case "poor":
      case "critical":
        bgColor = "bg-red-600";
        borderColor = "border-t-red-600";
        break;
    }

    return { bgColor, borderColor };
  };

  const { bgColor, borderColor } = getTooltipStyle();

  return (
    <div
      className={`absolute -top-14 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-lg text-sm font-bold shadow-xl whitespace-nowrap z-[9999] ${bgColor} text-white transition-all duration-300 opacity-100 scale-100`}
      style={{
        position: "absolute",
        top: "-3.5rem",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
      }}
    >
      {text}
      <div
        className={`absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent ${borderColor}`}
        style={{
          position: "absolute",
          top: "100%",
          left: "50%",
          transform: "translateX(-50%)",
        }}
      ></div>
    </div>
  );
};

export default TooltipComponent;
