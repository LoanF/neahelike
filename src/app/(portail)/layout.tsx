import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function PortailLayout({ children }: { children: React.ReactNode }) {
  return <main>{children}</main>;
}
