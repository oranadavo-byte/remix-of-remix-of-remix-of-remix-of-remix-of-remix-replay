import { Composition } from "remotion";
import { LoadingVideo } from "./LoadingVideo";

export const RemotionRoot: React.FC = () => (
  <Composition
    id="main"
    component={LoadingVideo}
    durationInFrames={360}
    fps={30}
    width={1920}
    height={1080}
  />
);
