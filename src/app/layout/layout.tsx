// src/app/layout/layout.tsx
"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { AppSidebar } from "./sidebar";
import { AppHeader } from "./header";
import { useEffect, useState } from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/components/themeProvider";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [scrolled, setScrolled] = useState(false);

  // 添加滚动效果检测
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="relative min-h-screen">
      <AppHeader
        className={cn(
          "transition-all duration-300",
          scrolled ? "bg-background/90 backdrop-blur-md shadow-md" : "",
        )}
      />
      <div className="relative z-10 flex">
        <SidebarProvider defaultOpen={true}>
          <AppSidebar className="left-0 top-[74px] h-[calc(100vh-74px)] backdrop-blur-sm z-20" />
          <SidebarInset className="top-[74px] pt-4 w-full">
            <div className="transition-all duration-300 animate-in fade-in slide-in-from-bottom-5">
              {/* <SidebarTrigger /> */}
              {children}
            </div>
          </SidebarInset>
        </SidebarProvider>
      </div>
    </div>
  );
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <ThemeProvider>
            <Layout>{children}</Layout>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
