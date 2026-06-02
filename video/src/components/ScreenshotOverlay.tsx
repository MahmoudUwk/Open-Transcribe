import React from "react";
import { interpolate, spring, useCurrentFrame, staticFile } from "remotion";

interface ScreenshotOverlayProps {
  visible: boolean;
  startFrame: number;
}

export const ScreenshotOverlay: React.FC<ScreenshotOverlayProps> = ({
  visible,
  startFrame,
}) => {
  const frame = useCurrentFrame();
  const localFrame = frame - startFrame;

  const scale = spring({
    frame: localFrame,
    fps: 30,
    config: { damping: 12, stiffness: 120, mass: 0.9 },
  });

  const opacity = interpolate(
    localFrame,
    [0, 8, 52, 60],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  if (!visible || localFrame < 0) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: `translate(-50%, -50%) scale(${scale})`,
        opacity,
        zIndex: 100,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          width: 900,
          borderRadius: 20,
          overflow: "hidden",
          border: "3px solid rgba(0, 229, 255, 0.5)",
          boxShadow:
            "0 0 50px rgba(0, 229, 255, 0.35), 0 24px 80px rgba(0, 0, 0, 0.7)",
          background: "#0b0f14",
        }}
      >
        <img
          src={staticFile("API_screenshot.png")}
          alt="AI Studio Create API Key"
          style={{
            width: "100%",
            height: "auto",
            display: "block",
          }}
        />
        <div
          style={{
            padding: "14px 24px",
            background: "rgba(0, 229, 255, 0.1)",
            color: "#00e5ff",
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: 18,
            fontWeight: 700,
            textAlign: "center",
            borderTop: "1px solid rgba(0, 229, 255, 0.2)",
          }}
        >
          aistudio.google.com — Create your free API key
        </div>
      </div>
    </div>
  );
};
