import React from "react";
import { Composition } from "remotion";
import { PromoVideo } from "./compositions/PromoVideo";

export const Root: React.FC = () => {
  return (
    <Composition
      id="OpenTranscribePromo"
      component={PromoVideo}
      durationInFrames={690}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
