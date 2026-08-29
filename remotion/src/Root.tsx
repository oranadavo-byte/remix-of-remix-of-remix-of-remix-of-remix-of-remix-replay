import { Composition } from "remotion";
import { LoadingVideo } from "./LoadingVideo";
import { PromoVideo, PROMO_FRAMES } from "./promo/PromoVideo";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="main"
      component={LoadingVideo}
      durationInFrames={360}
      fps={30}
      width={1920}
      height={1080}
    />
    <Composition
      id="promo"
      component={PromoVideo}
      durationInFrames={PROMO_FRAMES}
      fps={30}
      width={1920}
      height={1080}
    />
  </>
);
