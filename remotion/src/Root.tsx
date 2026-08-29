import { Composition } from "remotion";
import { LoadingVideo } from "./LoadingVideo";
import {
  PromoVideo,
  PROMO_FRAMES,
  PROMO_15_FRAMES,
  PROMO_30_FRAMES,
  SHORT_BEATS,
  LONG_BEATS,
} from "./promo/PromoVideo";

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
    <Composition
      id="promo15"
      component={PromoVideo}
      defaultProps={{ beats: SHORT_BEATS }}
      durationInFrames={PROMO_15_FRAMES}
      fps={30}
      width={1920}
      height={1080}
    />
    <Composition
      id="promo30"
      component={PromoVideo}
      defaultProps={{ beats: LONG_BEATS }}
      durationInFrames={PROMO_30_FRAMES}
      fps={30}
      width={1920}
      height={1080}
    />
  </>
);
