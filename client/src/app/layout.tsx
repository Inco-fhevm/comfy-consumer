import { Urbanist } from "next/font/google";
import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import TermsGate from "@/components/terms-gate";
import HomeLayout from "@/layout/home";
import { RainbowkitProvider } from "@/context/rainbow-provider";
import { TokenRegistryProvider } from "@/context/token-registry-provider";
import { SessionKeyProvider } from "@/context/session-key-provider";
import { TokenBalancesProvider } from "@/context/token-balances-provider";
import { QueryProvider } from "@/context/query-client-provider";
import { ComfyProvider } from "@comfy/sdk/react";
import { NETWORK, INDEXER_URL, TX_CONFIRMATIONS } from "@/lib/constants";

const sans = Urbanist({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

// Set NEXT_PUBLIC_SITE_URL to the production domain (used for OG/canonical URLs).
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://comfy-web-six.vercel.app";

const TITLE = "Comfy · Confidential Tokens by Inco";
const DESCRIPTION =
  "Shield, hold, and send tokens privately. Comfy brings confidential transfers to any ERC-20 — amounts and balances stay encrypted onchain — powered by Inco's full-stack privacy for blockchains.";
const OG_DESCRIPTION =
  "Private token transfers — amounts and balances stay encrypted onchain. Powered by Inco.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: "Comfy",
  title: { default: TITLE, template: "%s · Comfy" },
  description: DESCRIPTION,
  keywords: [
    "confidential tokens",
    "private transfers",
    "confidential ERC-20",
    "onchain privacy",
    "shielded balance",
    "encrypted amounts",
    "private DeFi",
    "Inco",
    "Base",
  ],
  manifest: "/manifest.json",
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  icons: { icon: "/favicon.ico" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Comfy",
    title: TITLE,
    description: OG_DESCRIPTION,
    images: [
      {
        url: "/images/og.png",
        width: 1200,
        height: 630,
        alt: "Comfy — confidential tokens, powered by Inco",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: OG_DESCRIPTION,
    site: "@inconetwork",
    creator: "@inconetwork",
    images: ["/images/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${sans.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        {/* Runtime config; sets window.__COMFY_ENV__ before hydration */}
        <Script src="/env/" strategy="beforeInteractive" />
        <QueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <RainbowkitProvider>
              <TermsGate />
              <ComfyProvider
                network={NETWORK}
                indexerUrl={INDEXER_URL}
                confirmations={TX_CONFIRMATIONS}
              >
                <SessionKeyProvider>
                  <TokenRegistryProvider>
                    <TokenBalancesProvider>
                      <HomeLayout>{children}</HomeLayout>
                    </TokenBalancesProvider>
                  </TokenRegistryProvider>
                </SessionKeyProvider>
              </ComfyProvider>
            </RainbowkitProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
