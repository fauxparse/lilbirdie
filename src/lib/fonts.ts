import { Geist, Pangolin } from "next/font/google";

export const geist = Geist({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
  variable: "--font-geist",
});

export const pangolin = Pangolin({
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
  variable: "--font-pangolin",
});
