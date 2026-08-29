import { loadFont as loadDisplay } from "@remotion/google-fonts/CormorantGaramond";
import { loadFont as loadBody } from "@remotion/google-fonts/Manrope";

export const display = loadDisplay("normal", { weights: ["600", "700"], subsets: ["latin"] }).fontFamily;
export const body = loadBody("normal", { weights: ["400", "600", "800"], subsets: ["latin"] }).fontFamily;
