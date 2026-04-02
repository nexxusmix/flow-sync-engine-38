import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { SceneIntro } from "./sequences/SceneIntro";
import { SceneDashboard } from "./sequences/SceneDashboard";
import { SceneModules } from "./sequences/SceneModules";
import { SceneAI } from "./sequences/SceneAI";
import { ScenePortal } from "./sequences/ScenePortal";
import { SceneCTA } from "./sequences/SceneCTA";

export const SquadHubDemo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#030303" }}>
      {/* Scene 1: Intro (0-4s, frames 0-120) */}
      <Sequence from={0} durationInFrames={120}>
        <SceneIntro />
      </Sequence>

      {/* Scene 2: Dashboard Overview (4-10s, frames 120-300) */}
      <Sequence from={120} durationInFrames={180}>
        <SceneDashboard />
      </Sequence>

      {/* Scene 3: Modules Grid (10-16s, frames 300-480) */}
      <Sequence from={300} durationInFrames={180}>
        <SceneModules />
      </Sequence>

      {/* Scene 4: AI Feature (16-22s, frames 480-660) */}
      <Sequence from={480} durationInFrames={180}>
        <SceneAI />
      </Sequence>

      {/* Scene 5: Client Portal (22-28s, frames 660-840) */}
      <Sequence from={660} durationInFrames={180}>
        <ScenePortal />
      </Sequence>

      {/* Scene 6: CTA (28-30s, frames 840-900) */}
      <Sequence from={840} durationInFrames={60}>
        <SceneCTA />
      </Sequence>
    </AbsoluteFill>
  );
};
