import { createFileRoute } from "@tanstack/react-router";
import { GameMount } from "@/components/GameMount";

const title = "Noctilume";
const description =
  "Noctilume — dash, strike and slay the Rootbound Guardian across nine lantern-lit chambers.";

/**
 * Game-only fullscreen build for portals (CrazyGames, itch, etc.).
 * No site chrome, no navigation, no outbound links — just the canvas.
 */
export const Route = createFileRoute("/embed")({
  ssr: false,
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Embed,
});

function Embed() {
  return (
    <main className="h-dvh w-full overflow-hidden bg-background">
      <h1 className="sr-only">Noctilume</h1>
      <GameMount portal />
    </main>
  );
}
