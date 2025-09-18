import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Toaster } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { AppSidebar } from "@/components/AppSidebar";
import { AuthProvider } from "@/components/AuthProvider";
import { MotionProvider } from "@/components/MotionProvider";
import { QueryProvider } from "@/components/QueryProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ModalProvider } from "@/components/ui/Modal";
import { SidebarInset, SidebarProvider } from "@/components/ui/Sidebar";

import "./globals.css";

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={geist.className}>
      <body>
        <QueryProvider>
          <AuthProvider>
            <ThemeProvider>
              <MotionProvider>
                <ModalProvider>
                  <SidebarProvider defaultOpen={false}>
                    <AppSidebar />
                    <SidebarInset>
                      <AppHeader />
                      <main className="flex flex-col flex-1 items-center w-full p-4 bg-background text-foreground">
                        {children}
                      </main>
                    </SidebarInset>
                  </SidebarProvider>
                </ModalProvider>
              </MotionProvider>
            </ThemeProvider>
          </AuthProvider>
        </QueryProvider>
        <Toaster expand />
      </body>
    </html>
  );
}
