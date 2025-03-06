import { ThemeProvider } from "@/context/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { Navbar } from "@/components/Navbar";
import { spaceGrotesk } from "@/styles/fonts";
import { headers } from "next/headers";
import ContextProvider from "@/context";
import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Frack.My",
  description: "Fracking for yield",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookies = (await headers()).get("cookie");

  return (
    <html lang="en" className={spaceGrotesk.variable} suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <ContextProvider cookies={cookies}>
            <Navbar />
            <main>{children}</main>
            <Toaster />
          </ContextProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
