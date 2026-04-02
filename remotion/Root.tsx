import React from "react";
import { Composition } from "remotion";
import { SquadHubDemo } from "./Video";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="SquadHubDemo"
      component={SquadHubDemo}
      durationInFrames={900}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
