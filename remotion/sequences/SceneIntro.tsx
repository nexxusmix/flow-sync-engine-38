import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

const DOT_GRID_SIZE = 40;
const DOT_RADIUS = 1.5;

const DotGrid: React.FC = () => {
  const frame = useCurrentFrame();
  const cols = Math.ceil(1920 / DOT_GRID_SIZE) + 1;
  const rows = Math.ceil(1080 / DOT_GRID_SIZE) + 1;
  const dots: React.ReactNode[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * DOT_GRID_SIZE;
      const y = r * DOT_GRID_SIZE;
      const dist = Math.sqrt(
        Math.pow(x - 960, 2) + Math.pow(y - 540, 2)
      );
      const wave = Math.sin(dist * 0.008 - frame * 0.05) * 0.5 + 0.5;
      const opacity = interpolate(wave, [0, 1], [0.03, 0.12]);

      dots.push(
        <circle
          key={`${r}-${c}`}
          cx={x}
          cy={y}
          r={DOT_RADIUS}
          fill="white"
          opacity={opacity}
        />
      );
    }
  }

  return (
    <svg
      width={1920}
      height={1080}
      style={{ position: "absolute", top: 0, left: 0 }}
    >
      {dots}
    </svg>
  );
};

export const SceneIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoOpacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: "clamp",
  });

  const logoScale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 100, mass: 0.8 },
  });

  const taglineChars = "O Sistema Operacional da Agencia Moderna".split("");
  const charsVisible = interpolate(frame, [30, 90], [0, taglineChars.length], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const taglineOpacity = interpolate(frame, [25, 35], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const cursorOpacity = Math.floor(frame / 8) % 2 === 0 ? 1 : 0;
  const showCursor = frame >= 30 && frame <= 100;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#030303",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <DotGrid />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 32,
          zIndex: 1,
        }}
      >
        {/* Logo */}
        <div
          style={{
            opacity: logoOpacity,
            transform: `scale(${logoScale})`,
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "linear-gradient(135deg, #009CCA, #0077A0)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                color: "white",
                fontSize: 32,
                fontWeight: 700,
                letterSpacing: -1,
              }}
            >
              S
            </span>
          </div>
          <span
            style={{
              color: "white",
              fontSize: 56,
              fontWeight: 700,
              letterSpacing: -2,
            }}
          >
            SQUAD{" "}
            <span style={{ color: "#009CCA" }}>Hub</span>
          </span>
        </div>

        {/* Tagline with typewriter */}
        <div
          style={{
            opacity: taglineOpacity,
            fontSize: 28,
            color: "rgba(255,255,255,0.7)",
            fontWeight: 400,
            letterSpacing: 0.5,
            height: 40,
          }}
        >
          {taglineChars.slice(0, Math.floor(charsVisible)).join("")}
          {showCursor && (
            <span style={{ opacity: cursorOpacity, color: "#009CCA" }}>|</span>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};
