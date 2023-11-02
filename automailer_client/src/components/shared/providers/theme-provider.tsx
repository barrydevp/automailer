import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "@/components/ui/themes";
import { ThemeProviderProps } from "@@types/components/ui/themes";
import { TooltipProvider } from "@/components/ui/tooltip";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
      <TooltipProvider>{children}</TooltipProvider>
    </NextThemesProvider>
  );
}
