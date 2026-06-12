

"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type SystemState = 'IDLE' | 'LISTENING' | 'ANALYZING' | 'MINTING' | 'OVERCLOCK';
export type DesignMode = 'SILENT' | 'AURA' | 'CHROME' | 'CYBER'; // Upgraded to include CYBER mode

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
  designMode: DesignMode;
  setDesignMode: (mode: DesignMode) => void;
  safeColors: SafeColors;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [systemState, setSystemState] = useState<SystemState>('IDLE');
  const [isOverclocked, setIsOverclocked] = useState(false);
  const [designMode, setDesignMode] = useState<DesignMode>('SILENT');

  useEffect(() => {
    if (isOverclocked) {
      setSystemState('OVERCLOCK');
    } else {
      setSystemState('IDLE');
    }
  }, [isOverclocked]);

  const toggleOverclock = () => setIsOverclocked(prev => !prev);

  const getSafeColors = (): SafeColors => {
    switch (systemState) {
      case 'OVERCLOCK':
        return {
          primary: "text-red-500",
          secondary: "text-red-400",
          border: "border-red-500/30",
          glow: "bg-red-950/25",
          dotBg: "bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)]",
          hoverPrimary: "hover:text-red-400",
          hoverBorder: "hover:border-red-500/50",
          bgPulse: "bg-red-950/20",
        };
      case 'ANALYZING':
        return {
          primary: "text-amber-400",
          secondary: "text-amber-300",
          border: "border-amber-500/30",
          glow: "bg-amber-950/25",
          dotBg: "bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.6)]",
          hoverPrimary: "hover:text-amber-400",
          hoverBorder: "hover:border-amber-500/50",
          bgPulse: "bg-amber-950/15",
        };
      case 'MINTING':
        return {
          primary: "text-purple-400",
          secondary: "text-purple-300",
          border: "border-purple-500/30",
          glow: "bg-purple-950/25",
          dotBg: "bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.6)]",
          hoverPrimary: "hover:text-purple-400",
          hoverBorder: "hover:border-purple-500/50",
          bgPulse: "bg-purple-950/15",
        };
      case 'LISTENING':
        return {
          primary: "text-[#00ffa3]/60", 
          secondary: "text-[#00b8ff]/60",
          border: "border-white/10",
          glow: "bg-transparent", 
          dotBg: "bg-[#00ffa3]/30",
          hoverPrimary: "hover:text-[#00ffa3]",
          hoverBorder: "hover:border-[#00ffa3]/30",
          bgPulse: "bg-black/50", 
        };
      case 'IDLE':
      default:
        // Adjust design base pallets dynamically depending on DesignMode
        if (designMode === "CYBER") {
          return {
            primary: "text-[#00ffa3]",
            secondary: "text-[#00b8ff]",
            border: "border-[#00ffa3]/30",
            glow: "bg-black/90",
            dotBg: "bg-[#00ffa3] shadow-[0_0_15px_rgba(0,255,163,0.8)]",
            hoverPrimary: "hover:text-[#00ffa3]",
            hoverBorder: "hover:border-[#00ffa3]/60",
            bgPulse: "bg-[#00ffa3]/10",
          };
        }
        return {
          primary: "text-[#00ffa3]",
          secondary: "text-[#00b8ff]",
          border: "border-white/18", 
          glow: "bg-[#00ffa3]/20",
          dotBg: "bg-[#00ffa3] shadow-[0_0_12px_rgba(0,255,163,0.4)]",
          hoverPrimary: "hover:text-[#00ffa3]",
          hoverBorder: "hover:border-[#00ffa3]/40",
          bgPulse: "bg-slate-950/25", 
        };
    }
  };

  return (
    <ThemeContext.Provider value={{ 
      systemState, 
      setSystemState, 
      isOverclocked, 
      toggleOverclock, 
      designMode, 
      setDesignMode, 
      safeColors: getSafeColors() 
    }}>
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
