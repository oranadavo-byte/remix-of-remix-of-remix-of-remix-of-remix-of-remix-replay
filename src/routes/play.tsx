import { createFileRoute, Link } from "@tanstack/react-router";
import { GameMount } from "@/components/GameMount";

const title = "Play Noctilume — A Lantern in the Rootbound Dark";
const description =
  "Play Noctilume free in your browser. Dash, strike and slay the Rootbound Guardian across nine underground chambers. Progress saves automatically.";

export const Route = createFileRoute("/play")({
  ssr: false,
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
  component: Play,
});

function Play() {
  return (
    <main className="relative h-dvh w-full overflow-hidden bg-background">
      <h1 className="sr-only">Play Noctilume</h1>
      <GameMount />
      <Link
        to="/"
        className="absolute left-4 top-4 z-20 rounded-md border border-border bg-background/70 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground backdrop-blur hover:text-primary"
      >
        ← Home
      </Link>
    </main>
  );
}
