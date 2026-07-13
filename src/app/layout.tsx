import { Inter } from "next/font/google";
import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import HomeLayout from "@/layout/home";
import { RainbowkitProvider } from "@/context/rainbow-provider";
import { ContractProvider } from "@/context/contract-provider";
import { TokenRegistryProvider } from "@/context/token-registry-provider";
import { SessionKeyProvider } from "@/context/session-key-provider";
import { TokenBalancesProvider } from "@/context/token-balances-provider";
import { QueryProvider } from "@/context/query-client-provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
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
      <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning>
        <QueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <ContractProvider>
              <RainbowkitProvider>
                <TokenRegistryProvider>
                  <SessionKeyProvider>
                    <TokenBalancesProvider>
                      <HomeLayout>{children}</HomeLayout>
                    </TokenBalancesProvider>
                  </SessionKeyProvider>
                </TokenRegistryProvider>
              </RainbowkitProvider>
            </ContractProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
