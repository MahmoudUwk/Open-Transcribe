import React from "react";

interface CursorTooltipProps {
  x: number;
  y: number;
  text: string;
}

export const CursorTooltip: React.FC<CursorTooltipProps> = ({ x, y, text }) => {
  if (!text) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: x + 28,
        top: y - 70,
        zIndex: 201,
        pointerEvents: "none",
        background: "rgba(11, 15, 20, 0.95)",
        border: "2px solid #00e5ff",
        borderRadius: 14,
        padding: "14px 28px",
        color: "#f8fafc",
        fontFamily: "Inter, system-ui, sans-serif",
        fontSize: 22,
        fontWeight: 700,
        whiteSpace: "nowrap",
        boxShadow: "0 0 30px rgba(0, 229, 255, 0.35), 0 8px 24px rgba(0,0,0,0.5)",
        lineHeight: 1.3,
      }}
    >
      {text}
    </div>
  );
};
