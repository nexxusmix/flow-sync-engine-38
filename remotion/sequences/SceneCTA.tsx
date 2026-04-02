import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

export const SceneCTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Background transition to blue
  const bgProgress = interpolate(frame, [0, 25], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const bgColor = `rgba(0, 156, 202, ${bgProgress * 0.15})`;

  // Logo
  const logoSpring = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 100, mass: 0.5 },
  });
  const logoScale = interpolate(logoSpring, [0, 1], [0.8, 1]);
  const logoOpacity = interpolate(logoSpring, [0, 1], [0, 1]);

  // URL text
  const urlOpacity = interpolate(frame, [15, 28], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const urlY = interpolate(frame, [15, 28], [15, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // CTA text
  const ctaOpacity = interpolate(frame, [25, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ctaY = interpolate(frame, [25, 40], [15, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#030303",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Gradient overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: bgColor,
        }}
      />

      {/* Radial glow */}
      <div
        style={{
          position: "absolute",
          width: 800,
          height: 800,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,156,202,0.12), transparent)",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 28,
          zIndex: 1,
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            opacity: logoOpacity,
            transform: `scale(${logoScale})`,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "linear-gradient(135deg, #009CCA, #0077A0)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                color: "white",
                fontSize: 28,
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
              fontSize: 52,
              fontWeight: 700,
              letterSpacing: -2,
            }}
          >
            SQUAD <span style={{ color: "#009CCA" }}>Hub</span>
          </span>
        </div>

        {/* URL */}
        <div
          style={{
            fontSize: 26,
            fontWeight: 500,
            color: "rgba(255,255,255,0.7)",
            letterSpacing: 1,
            opacity: urlOpacity,
            transform: `translateY(${urlY}px)`,
          }}
        >
          squadhub.app
        </div>

        {/* CTA */}
        <div
          style={{
            marginTop: 8,
            padding: "14px 40px",
            borderRadius: 12,
            backgroundColor: "rgba(0,156,202,0.15)",
            border: "1px solid rgba(0,156,202,0.4)",
            fontSize: 20,
            fontWeight: 600,
            color: "white",
            letterSpacing: 0.5,
            opacity: ctaOpacity,
            transform: `translateY(${ctaY}px)`,
          }}
        >
          Comece agora — sem cartao
        </div>
      </div>
    </AbsoluteFill>
  );
};
