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

  // The Semantic Aura Engine
  const getSafeColors = (): SafeColors => {
    switch (systemState) {
      case 'OVERCLOCK':
        return {
          primary: "text-red-500",
          secondary: "text-red-400",
          border: "border-red-500/30",
          glow: "bg-red-600/40",
          dotBg: "bg-red-500",
          hoverPrimary: "hover:text-red-400",
          hoverBorder: "hover:border-red-500/50",
          bgPulse: "bg-red-900/20",
        };
      case 'ANALYZING':
        return {
          primary: "text-amber-500",
          secondary: "text-amber-400",
          border: "border-amber-500/30",
          glow: "bg-amber-500/30",
          dotBg: "bg-amber-500",
          hoverPrimary: "hover:text-amber-400",
          hoverBorder: "hover:border-amber-500/50",
          bgPulse: "bg-amber-900/10",
        };
      case 'MINTING':
        return {
          primary: "text-purple-500",
          secondary: "text-purple-400",
          border: "border-purple-500/30",
          glow: "bg-purple-600/30",
          dotBg: "bg-purple-500",
          hoverPrimary: "hover:text-purple-400",
          hoverBorder: "hover:border-purple-500/50",
          bgPulse: "bg-purple-900/10",
        };
      case 'LISTENING':
        // The "Silence" State: Everything dims to focus on the user input
        return {
          primary: "text-emerald-500/50", 
          secondary: "text-emerald-400/50",
          border: "border-white/5",
          glow: "bg-transparent", 
          dotBg: "bg-emerald-500/30",
          hoverPrimary: "hover:text-emerald-400",
          hoverBorder: "hover:border-emerald-500/30",
          bgPulse: "bg-black/60", 
        };
      case 'IDLE':
      default:
        // Default Liquid Glass aesthetic
        return {
          primary: "text-emerald-500",
          secondary: "text-emerald-400",
          border: "border-white/10",
          glow: "bg-emerald-600/20",
          dotBg: "bg-emerald-500",
          hoverPrimary: "hover:text-emerald-400",
          hoverBorder: "hover:border-emerald-500/50",
          bgPulse: "bg-blue-900/10", 
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