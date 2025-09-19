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
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1 1"
          className="h-0 w-0 absolute top-0 left-0 -m-1"
        >
          <defs>
            <clipPath id="squircle" clipPathUnits="objectBoundingBox">
              <path
                d="M 0,0.5
                   C 0,0.0575  0.0575,0  0.5,0
                     0.9425,0  1,0.0575  1,0.5
                     1,0.9425  0.9425,1  0.5,1
                     0.0575,1  0,0.9425  0,0.5"
              />
            </clipPath>
          </defs>
        </svg>
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
