import { Inter } from "next/font/google";
import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import HomeLayout from "@/layout/home";
import { RainbowkitProvider } from "@/context/rainbow-provider";
import { ChainBalanceProvider } from "@/context/chain-balance-provider";
import { ContractProvider } from "@/context/contract-provider";
import { QueryProvider } from "@/context/query-client-provider";
// TODO: Import ContractProvider here once implemented

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
      <body className={`${inter.variable} font-sans antialiased`}>
        <QueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <ContractProvider>
              <RainbowkitProvider>
                <ChainBalanceProvider>
                  <HomeLayout>{children}</HomeLayout>
                </ChainBalanceProvider>
              </RainbowkitProvider>
            </ContractProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
