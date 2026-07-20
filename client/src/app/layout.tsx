import { Urbanist } from "next/font/google";
import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import TermsGate from "@/components/terms-gate";
import HomeLayout from "@/layout/home";
import { RainbowkitProvider } from "@/context/rainbow-provider";
import { TokenRegistryProvider } from "@/context/token-registry-provider";
import { SessionKeyProvider } from "@/context/session-key-provider";
import { TokenBalancesProvider } from "@/context/token-balances-provider";
import { QueryProvider } from "@/context/query-client-provider";

const sans = Urbanist({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Comfy",
  manifest: "/manifest.json",
  description: "Building the future of DeFi",
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
        <QueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <RainbowkitProvider>
              <TermsGate />
              <SessionKeyProvider>
                <TokenRegistryProvider>
                  <TokenBalancesProvider>
                    <HomeLayout>{children}</HomeLayout>
                  </TokenBalancesProvider>
                </TokenRegistryProvider>
              </SessionKeyProvider>
            </RainbowkitProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
