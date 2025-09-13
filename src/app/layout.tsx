import type { Metadata } from "next";
import "./globals.css";
import { AppHeader } from "@/components/AppHeader";
import { AppSidebar } from "@/components/AppSidebar";
import { AuthProvider } from "@/components/AuthProvider";
import { QueryProvider } from "@/components/QueryProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SidebarProvider } from "@/components/ui/Sidebar";

export const metadata: Metadata = {
  title: "Lil Birdie - Share Your Wishes",
  description: "A modern wishlist app for sharing your wishes and coordinating gifts with friends.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>
          <AuthProvider>
            <ThemeProvider>
              <SidebarProvider>
                <AppSidebar />
                <main
                  className="flex flex-col h-svh items-center w-full"
                  style={{
                    backgroundColor: "var(--color-background)",
                    color: "var(--color-foreground)",
                  }}
                >
                  <AppHeader />
                  {children}
                </main>
              </SidebarProvider>
            </ThemeProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
