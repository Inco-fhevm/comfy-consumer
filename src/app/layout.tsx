import { Inter } from "next/font/google";
import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import HomeLayout from "@/layout/home";
import { RainbowkitProvider } from "@/context/rainbow-provider";
import { ChainBalanceProvider } from "@/context/chain-balance-provider";

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
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <RainbowkitProvider>
            <ChainBalanceProvider>
              <HomeLayout>{children}</HomeLayout>
            </ChainBalanceProvider>
          </RainbowkitProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
