"use client";

import React, { useEffect, useState } from "react";
import { AppSidebar } from "@/app/[locale]/layout/sidebar";
import { AppHeader } from "@/app/[locale]/layout/header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

interface AppWrapperProps {
  children: React.ReactNode;
}

export function AppWrapper({ children }: AppWrapperProps) {
  const [scrolled, setScrolled] = useState(false);

  // Add scroll effect detection
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
              {children}
            </div>
          </SidebarInset>
        </SidebarProvider>
      </div>
    </div>
  );
}
