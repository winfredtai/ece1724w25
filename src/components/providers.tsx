"use client";

import React, { ReactNode } from "react";
import { AuthProvider } from "@/components/authProvider";
import { ThemeProvider } from "@/components/themeProvider";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      <AuthProvider>{children}</AuthProvider>
    </ThemeProvider>
  );
}
