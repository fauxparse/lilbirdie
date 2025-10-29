import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Toaster } from "sonner";
import { AuthProvider } from "@/components/AuthProvider";
import { MotionProvider } from "@/components/MotionProvider";
import { QueryProvider } from "@/components/QueryProvider";
import { RealTimeManager } from "@/components/RealTimeManager";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ModalProvider } from "@/components/ui/Modal";
import { SocketProvider } from "@/contexts/SocketContext";
import { getServerTheme, resolveTheme } from "@/lib/server/theme";

import "./globals.css";
import { AppHeader } from "@/components/AppHeader";

const geist = Geist({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
  variable: "--font-geist",
});

export const metadata: Metadata = {
  title: "Lil Birdie - Share Your Wishes",
  description: "A modern wishlist app for sharing your wishes and coordinating gifts with friends.",
};

export default async function RootLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  // Get the user's theme preference server-side
  const serverTheme = await getServerTheme();
  const resolvedTheme = resolveTheme(serverTheme);

  // Apply theme class to html element
  const themeClass = resolvedTheme === "dark" ? "dark" : resolvedTheme === "light" ? "" : "";

  return (
    <html
      lang="en"
      className={`${geist.className} ${themeClass}`}
      suppressHydrationWarning
      data-theme={serverTheme}
    >
      <body suppressHydrationWarning>
        <QueryProvider>
          <AuthProvider>
            <SocketProvider>
              <ThemeProvider serverTheme={serverTheme}>
                <MotionProvider>
                  <ModalProvider>
                    <AppHeader />
                    {children}
                    {modal}
                    <RealTimeManager />
                  </ModalProvider>
                </MotionProvider>
              </ThemeProvider>
            </SocketProvider>
          </AuthProvider>
        </QueryProvider>
        <Toaster expand />
      </body>
    </html>
  );
}
