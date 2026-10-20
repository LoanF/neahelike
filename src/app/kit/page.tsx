import type { Metadata } from "next";
import { KitDemo } from "./kit-demo";

export const metadata: Metadata = {
  title: "Composants",
  robots: { index: false, follow: false },
};

export default function KitPage() {
  return <KitDemo />;
}
