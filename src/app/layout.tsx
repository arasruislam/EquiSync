import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/components/providers/SessionProvider";
import SessionTimeoutProvider from "@/components/providers/SessionTimeoutProvider";
import { LoadingProvider } from "@/components/providers/LoadingProvider";
import { SocketProvider } from "@/components/providers/SocketProvider";
import { GlobalLoader } from "@/components/layout/GlobalLoader";

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
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          <SessionTimeoutProvider>
            <LoadingProvider>
              <SocketProvider>
                <GlobalLoader />
                {children}
              </SocketProvider>
            </LoadingProvider>
          </SessionTimeoutProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
