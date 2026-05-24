/*
“Must always include our chat rule from the beginning of this section to the end the rules and ways in all code outputs and design assets.”
*/

"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type SystemState = 'IDLE' | 'LISTENING' | 'ANALYZING' | 'MINTING' | 'OVERCLOCK';

type SafeColors = {
  primary: string;
  secondary: string;
  border: string;
  glow: string;
  dotBg: string;
  hoverPrimary: string;
  hoverBorder: string;
  bgPulse: string; 
};

interface ThemeContextType {
  systemState: SystemState;
  setSystemState: (state: SystemState) => void;
  isOverclocked: boolean;
  toggleOverclock: () => void;
  safeColors: SafeColors;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [systemState, setSystemState] = useState<SystemState>('IDLE');
  const [isOverclocked, setIsOverclocked] = useState(false);

  // The Overclock Override: If Beast Mode is on, it locks the system into Crimson
  useEffect(() => {
    if (isOverclocked) setSystemState('OVERCLOCK');
    else setSystemState('IDLE');
  }, [isOverclocked]);

  const toggleOverclock = () => setIsOverclocked(prev => !prev);

  // Softened Semantic Aura Engine for reduced eye strain
  const getSafeColors = (): SafeColors => {
    switch (systemState) {
      case 'OVERCLOCK':
        return {
          primary: "text-red-500",
          secondary: "text-red-400",
          border: "border-red-500/20",
          glow: "bg-red-950/25",
          dotBg: "bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)]",
          hoverPrimary: "hover:text-red-400",
          hoverBorder: "hover:border-red-500/40",
          bgPulse: "bg-red-950/15",
        };
      case 'ANALYZING':
        return {
          primary: "text-amber-500",
          secondary: "text-amber-400/80",
          border: "border-amber-500/20",
          glow: "bg-amber-950/20",
          dotBg: "bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.5)]",
          hoverPrimary: "hover:text-amber-400",
          hoverBorder: "hover:border-amber-500/40",
          bgPulse: "bg-amber-950/10",
        };
      case 'MINTING':
        return {
          primary: "text-purple-400",
          secondary: "text-purple-300",
          border: "border-purple-500/20",
          glow: "bg-purple-950/20",
          dotBg: "bg-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.5)]",
          hoverPrimary: "hover:text-purple-400",
          hoverBorder: "hover:border-purple-500/40",
          bgPulse: "bg-purple-950/10",
        };
      case 'LISTENING':
        return {
          primary: "text-emerald-500/40", 
          secondary: "text-emerald-400/40",
          border: "border-white/5",
          glow: "bg-transparent", 
          dotBg: "bg-emerald-500/20",
          hoverPrimary: "hover:text-emerald-400",
          hoverBorder: "hover:border-emerald-500/20",
          bgPulse: "bg-black/40", 
        };
      case 'IDLE':
      default:
        // Softened Liquid Glass default palette
        return {
          primary: "text-emerald-400",
          secondary: "text-emerald-300",
          border: "border-white/10",
          glow: "bg-emerald-950/15",
          dotBg: "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.3)]",
          hoverPrimary: "hover:text-emerald-300",
          hoverBorder: "hover:border-emerald-400/30",
          bgPulse: "bg-slate-950/20", 
        };
    }
  };

  return (
    <ThemeContext.Provider value={{ systemState, setSystemState, isOverclocked, toggleOverclock, safeColors: getSafeColors() }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}