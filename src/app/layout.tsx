import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { SidebarProvider } from "@/components/ui/WorkingSidebar";
import { AppLayout } from "@/components/AppLayout";

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
        <AuthProvider>
          <SidebarProvider>
            <AppLayout>
              {children}
            </AppLayout>
          </SidebarProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
