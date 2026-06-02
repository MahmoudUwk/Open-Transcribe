import React from "react";
import { interpolate, useCurrentFrame } from "remotion";

interface DropdownOverlayProps {
  visible: boolean;
  startFrame: number;
}

const OPTIONS = [
  { id: "transcribe-autodetect", label: "Transcribe (Autodetect languages)" },
  { id: "transcribe-plan", label: "Transcribe and Plan (Action items from audio)" },
  { id: "instruction-assistant", label: "Instruction Assistant (Do what you hear)" },
];

export const DropdownOverlay: React.FC<DropdownOverlayProps> = ({
  visible,
  startFrame,
}) => {
  const frame = useCurrentFrame();
  const localFrame = frame - startFrame;

  const opacity = interpolate(localFrame, [0, 6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  if (!visible) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: 540,
        top: 310,
        width: 620,
        opacity,
        zIndex: 80,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          background: "#0b0f14",
          border: "1px solid rgba(56, 68, 85, 0.5)",
          borderRadius: 14,
          overflow: "hidden",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
        }}
      >
        {OPTIONS.map((opt, i) => (
          <div
            key={opt.id}
            style={{
              padding: "14px 20px",
              fontFamily: "Inter, system-ui, sans-serif",
              fontSize: 16,
              color: i === 0 ? "#00e5ff" : "#94a3b8",
              background: i === 0 ? "rgba(0, 229, 255, 0.08)" : "transparent",
              borderBottom:
                i < OPTIONS.length - 1
                  ? "1px solid rgba(56, 68, 85, 0.3)"
                  : "none",
              fontWeight: i === 0 ? 600 : 400,
            }}
          >
            {opt.label}
          </div>
        ))}
      </div>
    </div>
  );
};
