import { Inter } from "next/font/google";
import "./globals.css";
import { RainbowKitWrapper } from "@/rainbow-wallet/rainbow-provider";
import Layout from "@/components/layout";
import { ThemeProvider } from "@/theme/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import AuthWrapper from "@/auth/auth-wrapper";
import { AuthProvider } from "@/context/auth-context";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata = {
  title: "Comfy",
  manifest: "/manifest.json",
  description: "Building the future of DeFi",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light">
          <RainbowKitWrapper>
            <AuthProvider>
              <AuthWrapper>
                <Layout>{children}</Layout>
              </AuthWrapper>
            </AuthProvider>
          </RainbowKitWrapper>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
