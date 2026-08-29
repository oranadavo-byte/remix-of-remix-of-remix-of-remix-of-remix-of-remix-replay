import { createFileRoute, Link } from "@tanstack/react-router";

const title = "Noctilume — A Lantern in the Rootbound Dark";
const description =
  "A hand-drawn 2D action platformer. Carry the last lantern through nine collapsing chambers, forge your embers, and fell the Rootbound Guardian. Play free in your browser.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    k: "Nine chambers",
    v: "A continuous descent — broken passages, lantern shafts, dash gaps and a shrine that anchors your light.",
  },
  {
    k: "Ember skill tree",
    v: "Every four fallen creatures yields an ember. Spend them on leap, edge, tempo, vitality — and respec any time.",
  },
  {
    k: "The Rootbound Guardian",
    v: "A two-phase arena fight that reads your habits. Learn its tells or feed it your masks.",
  },
];

function Landing() {
  return (
    <main className="min-h-dvh bg-background text-foreground">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-primary/15 blur-[140px]"
        />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:py-28">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.42em] text-primary">
              A lantern in the rootbound dark
            </p>
            <h1 className="mt-5 text-6xl font-black leading-[0.92] tracking-tight sm:text-7xl">
              Noctilume
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
              Nine chambers deep, the light went out. Take the last lantern, learn to leap, dash and
              strike, and carry the flame down to whatever is waiting at the roots.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link
                to="/play"
                className="group inline-flex items-center gap-3 rounded-md bg-primary px-8 py-4 text-base font-bold uppercase tracking-[0.18em] text-primary-foreground shadow-[0_0_40px_-8px_var(--color-primary)] transition-transform hover:-translate-y-0.5"
              >
                Play now
                <span aria-hidden className="transition-transform group-hover:translate-x-1">
                  →
                </span>
              </Link>
              <a
                href="#trailer"
                className="rounded-md border border-border px-6 py-4 font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground hover:text-primary"
              >
                Watch trailer
              </a>
            </div>
            <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
              Free · Browser · Progress saves on this device
            </p>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-2xl shadow-black/50">
              <video
                className="aspect-video w-full"
                src="/media/noctilume-promo-15s.mp4"
                poster="/media/noctilume-poster.jpg"
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                aria-label="Noctilume 15 second promo loop"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.42em] text-primary">
          What waits below
        </h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {FEATURES.map((f) => (
            <article key={f.k} className="rounded-xl border border-border bg-card p-6">
              <h3 className="text-lg font-bold">{f.k}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.v}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Trailer */}
      <section id="trailer" className="border-y border-border bg-card/40">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.42em] text-primary">
            The full trailer — 30 seconds
          </h2>
          <div className="mt-8 overflow-hidden rounded-xl border border-border bg-background shadow-2xl shadow-black/50">
            <video
              className="aspect-video w-full"
              src="/media/noctilume-promo-30s.mp4"
              poster="/media/noctilume-poster.jpg"
              controls
              playsInline
              preload="none"
              aria-label="Noctilume 30 second trailer"
            />
          </div>
          <div className="mt-6 flex flex-wrap gap-4 font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
            <a href="/media/noctilume-promo-15s.mp4" download className="hover:text-primary">
              ↓ 15s cut
            </a>
            <a href="/media/noctilume-promo-30s.mp4" download className="hover:text-primary">
              ↓ 30s cut
            </a>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h2 className="text-4xl font-black tracking-tight sm:text-5xl">Carry the light down.</h2>
        <p className="mt-4 text-muted-foreground">
          No install, no account. Your chambers, embers and unlocks are kept on this device.
        </p>
        <Link
          to="/play"
          className="mt-9 inline-flex items-center gap-3 rounded-md bg-primary px-10 py-4 text-base font-bold uppercase tracking-[0.18em] text-primary-foreground shadow-[0_0_40px_-8px_var(--color-primary)] transition-transform hover:-translate-y-0.5"
        >
          Play Noctilume
        </Link>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-8 font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
          <span>Noctilume</span>
          <Link to="/stats" className="hover:text-primary">
            Play stats
          </Link>
        </div>
      </footer>
    </main>
  );
}
