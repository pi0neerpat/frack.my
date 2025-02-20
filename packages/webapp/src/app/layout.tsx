import "./globals.css";
import type { Metadata } from "next";
import { headers } from "next/headers";
import ContextProvider from "@/context";
import { Navbar } from "@/components/Navbar";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "WEB3 DAPP TEMPALTE",
  description: "A web3 dApp template for building web3 applications",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookies = (await headers()).get("cookie");

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800">
        <ThemeProvider defaultTheme="system">
          <ContextProvider cookies={cookies}>
            <Navbar />
            <main>{children}</main>
          </ContextProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
