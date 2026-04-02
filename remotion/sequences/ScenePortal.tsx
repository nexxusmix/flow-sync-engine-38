import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

interface PanelProps {
  title: string;
  side: "left" | "right";
  children: React.ReactNode;
}

const Panel: React.FC<PanelProps> = ({ title, side, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const delay = side === "left" ? 0 : 10;
  const panelSpring = spring({
    frame: frame - delay,
    fps,
    config: { damping: 14, stiffness: 80, mass: 0.6 },
  });

  const slideX = interpolate(
    panelSpring,
    [0, 1],
    [side === "left" ? -60 : 60, 0]
  );
  const opacity = interpolate(panelSpring, [0, 1], [0, 1]);

  return (
    <div
      style={{
        width: 780,
        borderRadius: 20,
        backgroundColor: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        padding: 36,
        transform: `translateX(${slideX}px)`,
        opacity,
        display: "flex",
        flexDirection: "column",
        gap: 24,
      }}
    >
      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: side === "left" ? "#009CCA" : "#C9A84C",
          textTransform: "uppercase" as const,
          letterSpacing: 2,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
};

interface DeliverableCardProps {
  name: string;
  status: string;
  statusColor: string;
  delay: number;
}

const DeliverableCard: React.FC<DeliverableCardProps> = ({
  name,
  status,
  statusColor,
  delay,
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [delay, delay + 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const y = interpolate(frame, [delay, delay + 15], [12, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 20px",
        borderRadius: 12,
        backgroundColor: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
        opacity,
        transform: `translateY(${y}px)`,
      }}
    >
      <span style={{ fontSize: 16, color: "white", fontWeight: 500 }}>
        {name}
      </span>
      <span
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: statusColor,
          padding: "4px 12px",
          borderRadius: 8,
          backgroundColor: `${statusColor}15`,
        }}
      >
        {status}
      </span>
    </div>
  );
};

export const ScenePortal: React.FC = () => {
  const frame = useCurrentFrame();

  // Progress bar animation
  const progressWidth = interpolate(frame, [50, 100], [0, 78], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Bottom tagline
  const taglineOpacity = interpolate(frame, [120, 145], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const taglineY = interpolate(frame, [120, 145], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Section title
  const titleOpacity = interpolate(frame, [0, 15], [0, 1], {
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
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 40,
        }}
      >
        <div
          style={{
            fontSize: 20,
            fontWeight: 500,
            color: "#009CCA",
            textTransform: "uppercase" as const,
            letterSpacing: 4,
            opacity: titleOpacity,
          }}
        >
          Portal do Cliente
        </div>

        <div style={{ display: "flex", gap: 32 }}>
          {/* Agency View */}
          <Panel title="Visao da Agencia" side="left">
            <DeliverableCard
              name="Video Institucional"
              status="Em revisao"
              statusColor="#C9A84C"
              delay={20}
            />
            <DeliverableCard
              name="Tour 360 Virtual"
              status="Aprovado"
              statusColor="#22C55E"
              delay={30}
            />
            <DeliverableCard
              name="Pack Social Media"
              status="Em producao"
              statusColor="#009CCA"
              delay={40}
            />
          </Panel>

          {/* Client View */}
          <Panel title="Visao do Cliente" side="right">
            <DeliverableCard
              name="Video Institucional"
              status="Aprovar"
              statusColor="#C9A84C"
              delay={25}
            />
            <DeliverableCard
              name="Tour 360 Virtual"
              status="Aprovado"
              statusColor="#22C55E"
              delay={35}
            />

            {/* Progress bar */}
            <div
              style={{
                marginTop: 8,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 14,
                  color: "rgba(255,255,255,0.5)",
                }}
              >
                <span>Progresso geral</span>
                <span>{Math.round(progressWidth)}%</span>
              </div>
              <div
                style={{
                  width: "100%",
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: "rgba(255,255,255,0.06)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${progressWidth}%`,
                    height: "100%",
                    borderRadius: 4,
                    background:
                      "linear-gradient(90deg, #009CCA, #00BDF0)",
                  }}
                />
              </div>
            </div>
          </Panel>
        </div>

        {/* Bottom tagline */}
        <div
          style={{
            fontSize: 24,
            fontWeight: 600,
            color: "white",
            opacity: taglineOpacity,
            transform: `translateY(${taglineY}px)`,
          }}
        >
          Seu cliente tambem percebe a diferenca
        </div>
      </div>
    </AbsoluteFill>
  );
};
