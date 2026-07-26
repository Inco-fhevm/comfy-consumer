import type { ReactNode } from "react";
import { Providers } from "./providers";
import "./globals.css";
import "@comfy/sdk/ui/styles.css";

export const metadata = { title: "Comfy SDK Playground" };
// Wallet app — skip static prerender.
export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
