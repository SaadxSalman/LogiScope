import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LogiScope-Agent | Verification workspace",
  description: "Agentic retrieval for proofs, inference, and symbolic analysis.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
