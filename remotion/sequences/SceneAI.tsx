import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

const USER_MESSAGE = "Gere o briefing do projeto Aurora Oasis";

const RESPONSE_LINES = [
  "Projeto: Aurora Oasis",
  "Cliente: Silva Investimentos",
  "Local: Lago Corumba IV",
  "Escopo: Video institucional + Tour 360",
  "Prazo: 45 dias",
  "Status: Em producao",
];

export const SceneAI: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Chat container fade in
  const containerSpring = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 80, mass: 0.6 },
  });
  const containerOpacity = interpolate(containerSpring, [0, 1], [0, 1]);
  const containerScale = interpolate(containerSpring, [0, 1], [0.95, 1]);

  // User message typing (frames 15-60)
  const userCharsVisible = interpolate(frame, [15, 60], [0, USER_MESSAGE.length], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Response lines stagger (start at frame 75)
  const responseStart = 75;

  // Bottom tagline
  const taglineOpacity = interpolate(frame, [140, 160], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const taglineY = interpolate(frame, [140, 160], [20, 0], {
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
        {/* Section label */}
        <div
          style={{
            fontSize: 20,
            fontWeight: 500,
            color: "#009CCA",
            textTransform: "uppercase" as const,
            letterSpacing: 4,
            opacity: interpolate(frame, [0, 15], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          Polo AI
        </div>

        {/* Chat mockup */}
        <div
          style={{
            width: 800,
            borderRadius: 24,
            backgroundColor: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            padding: 40,
            opacity: containerOpacity,
            transform: `scale(${containerScale})`,
            display: "flex",
            flexDirection: "column",
            gap: 28,
          }}
        >
          {/* User message bubble */}
          {frame >= 15 && (
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <div
                style={{
                  backgroundColor: "rgba(0,156,202,0.15)",
                  border: "1px solid rgba(0,156,202,0.3)",
                  borderRadius: 16,
                  borderBottomRightRadius: 4,
                  padding: "16px 24px",
                  maxWidth: 500,
                  fontSize: 18,
                  color: "white",
                  fontWeight: 400,
                }}
              >
                {USER_MESSAGE.slice(0, Math.floor(userCharsVisible))}
                {frame < 60 && Math.floor(frame / 8) % 2 === 0 && (
                  <span style={{ color: "#009CCA" }}>|</span>
                )}
              </div>
            </div>
          )}

          {/* AI response */}
          {frame >= responseStart && (
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <div
                style={{
                  backgroundColor: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 16,
                  borderBottomLeftRadius: 4,
                  padding: "24px 28px",
                  maxWidth: 560,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                {/* Polo AI label */}
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#009CCA",
                    letterSpacing: 1,
                    marginBottom: 4,
                  }}
                >
                  POLO AI
                </div>

                {RESPONSE_LINES.map((line, i) => {
                  const lineDelay = responseStart + i * 10;
                  const lineOpacity = interpolate(
                    frame,
                    [lineDelay, lineDelay + 12],
                    [0, 1],
                    {
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                    }
                  );
                  const lineY = interpolate(
                    frame,
                    [lineDelay, lineDelay + 12],
                    [8, 0],
                    {
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                    }
                  );

                  return (
                    <div
                      key={line}
                      style={{
                        fontSize: 17,
                        color: "rgba(255,255,255,0.8)",
                        fontWeight: 400,
                        opacity: lineOpacity,
                        transform: `translateY(${lineY}px)`,
                      }}
                    >
                      {line}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
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
          IA que executa, nao so sugere
        </div>
      </div>
    </AbsoluteFill>
  );
};
