import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

interface ModuleItemProps {
  name: string;
  icon: string;
  index: number;
}

const ModuleItem: React.FC<ModuleItemProps> = ({ name, icon, index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const row = Math.floor(index / 3);
  const col = index % 3;
  const delay = row * 10 + col * 6;

  const appear = spring({
    frame: frame - delay,
    fps,
    config: { damping: 12, stiffness: 80, mass: 0.5 },
  });

  const scale = interpolate(appear, [0, 1], [0.6, 1]);
  const opacity = interpolate(appear, [0, 1], [0, 1]);

  // Glow pulse
  const glowPhase = Math.sin((frame - delay) * 0.06) * 0.5 + 0.5;
  const glowOpacity = frame > delay + 20 ? interpolate(glowPhase, [0, 1], [0, 0.25]) : 0;

  return (
    <div
      style={{
        width: 260,
        height: 220,
        borderRadius: 20,
        backgroundColor: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
        transform: `scale(${scale})`,
        opacity,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Glow effect */}
      <div
        style={{
          position: "absolute",
          width: 120,
          height: 120,
          borderRadius: "50%",
          background: "radial-gradient(circle, #009CCA, transparent)",
          opacity: glowOpacity,
          top: "30%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
        }}
      />

      {/* Icon */}
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 16,
          backgroundColor: "rgba(0,156,202,0.1)",
          border: "1px solid rgba(0,156,202,0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 28,
          zIndex: 1,
        }}
      >
        <span style={{ color: "#009CCA", fontWeight: 600 }}>{icon}</span>
      </div>

      {/* Name */}
      <div
        style={{
          fontSize: 18,
          fontWeight: 600,
          color: "white",
          letterSpacing: 0.3,
          zIndex: 1,
        }}
      >
        {name}
      </div>
    </div>
  );
};

const modules = [
  { name: "CRM", icon: "CRM" },
  { name: "Projetos", icon: "PRJ" },
  { name: "Financeiro", icon: "FIN" },
  { name: "Portal", icon: "PTL" },
  { name: "IA", icon: "AI" },
  { name: "Automacao", icon: "AUT" },
];

export const SceneModules: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 100, mass: 0.5 },
  });
  const titleOpacity = interpolate(titleSpring, [0, 1], [0, 1]);
  const titleY = interpolate(titleSpring, [0, 1], [-30, 0]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#030303",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 50,
        }}
      >
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
          Tudo em um lugar
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 260px)",
            gap: 24,
          }}
        >
          {modules.map((mod, i) => (
            <ModuleItem key={mod.name} name={mod.name} icon={mod.icon} index={i} />
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
