import { writeFileSync, mkdirSync } from "fs";
import path from "path";
import { FULL_BEATS, SHORT_BEATS, LONG_BEATS } from "../src/promo/PromoVideo";
import { toSrt } from "../src/promo/captions";

const outDir = process.env["SRT_OUT_DIR"] ?? path.resolve(import.meta.dir, "../../public/media");
mkdirSync(outDir, { recursive: true });

const targets: Array<[string, typeof FULL_BEATS]> = [
  ["noctilume-promo.srt", FULL_BEATS],
  ["noctilume-promo-15s.srt", SHORT_BEATS],
  ["noctilume-promo-30s.srt", LONG_BEATS],
];

for (const [name, beats] of targets) {
  writeFileSync(path.join(outDir, name), toSrt(beats, 30), "utf8");
  console.log("wrote", path.join(outDir, name));
}
