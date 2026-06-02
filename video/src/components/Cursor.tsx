import React from "react";

interface CursorProps {
  x: number;
  y: number;
}

export const Cursor: React.FC<CursorProps> = ({ x, y }) => {
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: 28,
        height: 28,
        zIndex: 200,
        pointerEvents: "none",
        transform: "translate(-2px, -2px)",
      }}
    >
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.6))" }}
      >
        <path
          d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87a.5.5 0 0 0 .35-.85L6.35 2.86a.5.5 0 0 0-.85.35Z"
          fill="white"
          stroke="#0b0f14"
          strokeWidth="1.5"
        />
      </svg>
    </div>
  );
};
