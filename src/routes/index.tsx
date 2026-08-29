import { createFileRoute } from "@tanstack/react-router";
import { GameMount } from "@/components/GameMount";

const title = "Noctilume — A Lantern in the Rootbound Dark";
const description =
  "Play Noctilume, a hand-drawn 2D action platformer. Dash, strike and slay the Rootbound Guardian across nine underground chambers.";

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
  component: Index,
});

function Index() {
  return (
    <main className="h-dvh w-full overflow-hidden bg-background">
      <h1 className="sr-only">Noctilume — a lantern in the rootbound dark</h1>
      <GameMount />
    </main>
  );
}
