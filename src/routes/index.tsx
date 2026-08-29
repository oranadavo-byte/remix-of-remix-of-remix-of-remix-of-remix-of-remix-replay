import { createFileRoute } from "@tanstack/react-router";
import { GameMount } from "@/components/GameMount";

const title = "Noctilume — A Lantern in the Rootbound Dark";
const description =
  "Play Noctilume free in your browser. Dash, strike and slay the Rootbound Guardian across nine lantern-lit chambers. Progress saves automatically.";

/**
 * Root route is the game itself — fullscreen, portal-ready
 * (CrazyGames SDK lifecycle, midgame + rewarded ads via GameMount portal mode).
 */
export const Route = createFileRoute("/")({
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
  component: Home,
});

function Home() {
  return (
    <main className="h-dvh w-full overflow-hidden bg-background">
      <h1 className="sr-only">Noctilume</h1>
      <GameMount portal />
    </main>
  );
}
