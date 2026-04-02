import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

interface KpiCardProps {
  label: string;
  value: string;
  index: number;
  accentColor: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ label, value, index, accentColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const delay = index * 8;

  const slideUp = spring({
    frame: frame - delay,
    fps,
    config: { damping: 14, stiffness: 80, mass: 0.6 },
  });

  const translateY = interpolate(slideUp, [0, 1], [80, 0]);
  const opacity = interpolate(slideUp, [0, 1], [0, 1]);

  return (
    <div
      style={{
        width: 340,
        padding: "40px 32px",
        borderRadius: 20,
        backgroundColor: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        transform: `translateY(${translateY}px)`,
        opacity,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div
        style={{
          fontSize: 44,
          fontWeight: 700,
          color: "white",
          letterSpacing: -1,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 18,
          fontWeight: 400,
          color: "rgba(255,255,255,0.5)",
        }}
      >
        {label}
      </div>
      <div
        style={{
          width: 48,
          height: 3,
          borderRadius: 2,
          backgroundColor: accentColor,
          marginTop: 4,
        }}
      />
    </div>
  );
};

const kpis = [
  { label: "Receita Mensal", value: "R$ 125.000", accent: "#009CCA" },
  { label: "Projetos Ativos", value: "24", accent: "#009CCA" },
  { label: "Entregas no Prazo", value: "98%", accent: "#C9A84C" },
  { label: "Clientes", value: "12", accent: "#009CCA" },
];

export const SceneDashboard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 100, mass: 0.5 },
  });
  const titleOpacity = interpolate(titleSpring, [0, 1], [0, 1]);
  const titleY = interpolate(titleSpring, [0, 1], [-30, 0]);

  // Subtle glow pulse behind cards
  const glowOpacity = interpolate(
    Math.sin(frame * 0.04),
    [-1, 1],
    [0.02, 0.06]
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#030303",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: "absolute",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: "radial-gradient(circle, #009CCA, transparent)",
          opacity: glowOpacity,
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
          gap: 60,
        }}
      >
        {/* Section title */}
        <div
          style={{
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
            fontSize: 20,
            fontWeight: 500,
            color: "#009CCA",
            textTransform: "uppercase" as const,
            letterSpacing: 4,
          }}
        >
          Dashboard em tempo real
        </div>

        {/* KPI Cards */}
        <div style={{ display: "flex", gap: 24 }}>
          {kpis.map((kpi, i) => (
            <KpiCard
              key={kpi.label}
              label={kpi.label}
              value={kpi.value}
              index={i}
              accentColor={kpi.accent}
            />
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
