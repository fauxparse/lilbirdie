import type { Metadata } from "next";
import { Toaster } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { AuthProvider } from "@/components/AuthProvider";
import { MotionProvider } from "@/components/MotionProvider";
import { QueryProvider } from "@/components/QueryProvider";
import { RealTimeManager } from "@/components/RealTimeManager";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ModalProvider } from "@/components/ui/Modal";
import { SocketProvider } from "@/contexts/SocketContext";
import { geist, pangolin } from "@/lib/fonts";
import { getServerTheme, resolveTheme } from "@/lib/server/theme";

import "./globals.css";

// Force dynamic rendering since we need to access session/headers for theme
export const dynamic = "force-dynamic";

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
      className={`${geist.variable} ${pangolin.variable} ${themeClass}`}
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
