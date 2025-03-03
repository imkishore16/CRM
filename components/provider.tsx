"use client";

import { SocketContextProvider } from "@/context/socket-context";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";
import { Appbar } from "./Appbar";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
              <SessionProvider>
                <Appbar showThemeSwitch={true} />


                {/* <SocketContextProvider> */}
                  {children}
                  {/* </SocketContextProvider> */}
              </SessionProvider>
  );
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
