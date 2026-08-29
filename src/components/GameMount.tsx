import { useEffect, useRef, useState } from "react";
import type Phaser from "phaser";

export function GameMount({ portal = false }: { portal?: boolean }) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const [paused, setPaused] = useState(false);
  const [volume, setVolumeState] = useState(0.6);
  const [ready, setReady] = useState(false);
  const [reviveOffer, setReviveOffer] = useState(false);
  const [adBusy, setAdBusy] = useState(false);
  const audioRef = useRef<null | typeof import("../game/audio")>(null);
  const portalRef = useRef<null | typeof import("../game/portal")>(null);

  useEffect(() => {
    let disposed = false;
    let game: Phaser.Game | null = null;

    (async () => {
      const [{ createGame }, audio, p] = await Promise.all([
        import("../game/createGame"),
        import("../game/audio"),
        import("../game/portal"),
      ]);
      portalRef.current = p;
      if (portal) {
        await p.initPortal();
        p.loadingStart();
      }
      if (disposed || !hostRef.current) return;
      audioRef.current = audio;
      setVolumeState(audio.getVolume());
      game = createGame(hostRef.current);
      gameRef.current = game;
      game.events.on("pause-toggle", (v: boolean) => {
        setPaused(v);
        if (v) portalRef.current?.gameplayStop();
        else portalRef.current?.gameplayStart();
      });
      game.events.on("revive-offer", () => setReviveOffer(true));
      if (portal) {
        p.loadingStop();
        p.gameplayStart();
      }
      setReady(true);
    })();

    return () => {
      disposed = true;
      game?.destroy(true);
      gameRef.current = null;
    };
  }, [portal]);

  const answerRevive = async (watchAd: boolean) => {
    if (adBusy) return;
    let revived = false;
    if (watchAd) {
      setAdBusy(true);
      revived = (await portalRef.current?.requestRewardedAd()) ?? false;
      setAdBusy(false);
    }
    setReviveOffer(false);
    gameRef.current?.events.emit("revive-result", revived);
  };

  const resume = () => {
    const scene = gameRef.current?.scene.getScene("Game") as
      | (Phaser.Scene & { setPaused: (v: boolean) => void })
      | null;
    scene?.setPaused(false);
  };

  const changeVolume = (v: number) => {
    setVolumeState(v);
    audioRef.current?.setMasterVolume(v);
  };

  return (
    <div className="relative flex h-dvh w-full flex-col items-center justify-center overflow-hidden bg-background">
      <div ref={hostRef} className="h-full w-full" />

      {!ready && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <p className="font-mono text-sm tracking-[0.3em] text-primary">KINDLING THE LANTERN...</p>
        </div>
      )}

      {reviveOffer && (
        <div className="absolute inset-0 grid place-items-center bg-background/90 backdrop-blur-sm">
          <div className="w-[min(90vw,26rem)] rounded-lg border border-border bg-card/95 p-8 text-center shadow-2xl">
            <h2 className="font-mono text-2xl tracking-[0.2em] text-primary">YOUR LANTERN DIMS</h2>
            <p className="mt-3 font-mono text-xs leading-relaxed text-muted-foreground">
              Watch a short ad to relight it and keep fighting the Guardian.
            </p>
            <button
              type="button"
              disabled={adBusy}
              onClick={() => answerRevive(true)}
              className="mt-6 w-full rounded-md bg-primary px-4 py-2 font-mono text-sm tracking-widest text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
            >
              {adBusy ? "LOADING AD..." : "RELIGHT — WATCH AD"}
            </button>
            <button
              type="button"
              disabled={adBusy}
              onClick={() => answerRevive(false)}
              className="mt-3 w-full rounded-md border border-border px-4 py-2 font-mono text-xs tracking-widest text-muted-foreground transition hover:text-foreground disabled:opacity-60"
            >
              RESPAWN AT SHRINE
            </button>
          </div>
        </div>
      )}

      {paused && (
        <div className="absolute inset-0 grid place-items-center bg-background/85 backdrop-blur-sm">
          <div className="w-[min(90vw,26rem)] rounded-lg border border-border bg-card/90 p-8 text-center shadow-2xl">
            <h2 className="font-mono text-2xl tracking-[0.2em] text-primary">PAUSED</h2>
            <div className="mt-6 text-left">
              <label
                htmlFor="volume"
                className="font-mono text-xs uppercase tracking-widest text-muted-foreground"
              >
                Volume
              </label>
              <input
                id="volume"
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={volume}
                onChange={(e) => changeVolume(Number(e.target.value))}
                className="mt-2 w-full accent-primary"
              />
            </div>
            <button
              type="button"
              onClick={resume}
              className="mt-8 w-full rounded-md bg-primary px-4 py-2 font-mono text-sm tracking-widest text-primary-foreground transition hover:opacity-90"
            >
              RESUME
            </button>
            <p className="mt-4 font-mono text-[11px] leading-relaxed text-muted-foreground">
              A / D move · SPACE jump · J or click strike · K / SHIFT dash · ESC pause
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
