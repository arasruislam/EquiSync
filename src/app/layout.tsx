import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/components/providers/SessionProvider";
import SessionTimeoutProvider from "@/components/providers/SessionTimeoutProvider";
import { LoadingProvider } from "@/components/providers/LoadingProvider";
import { SocketProvider } from "@/components/providers/SocketProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { GlobalLoader } from "@/components/layout/GlobalLoader";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "QuoteXStudio - Internal Management",
  description: "Secure internal management system for QuoteXStudio",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <SessionProvider>
            <SessionTimeoutProvider>
              <LoadingProvider>
                <SocketProvider>
                  <GlobalLoader />
                  {children}
                  <Analytics />
                  <SpeedInsights />
                </SocketProvider>
              </LoadingProvider>
            </SessionTimeoutProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
