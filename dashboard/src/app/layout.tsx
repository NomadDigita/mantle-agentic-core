

"use client";

import "./globals.css";
import { Inter } from "next/font/google";
import { ThemeProvider, useTheme } from "./ThemeContext";
import ContextProvider from "../context";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import React, { useEffect, useState, useMemo } from "react";
// @ts-ignore
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({ subsets: ["latin"] });

const ParticleBackground: React.FC = () => {
  const { isOverclocked, systemState, designMode } = useTheme();
  const [init, setInit] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => setInit(true));
  }, []);

  const getParticleColor = (state: string) => {
    switch (state) {
      case 'OVERCLOCK': 
        return "#ef4444"; 
      case 'ANALYZING': 
        return "#f59e0b"; 
      case 'MINTING': 
        return "#a855f7";   
      case 'LISTENING': 
        return "#10b981"; 
      case 'IDLE':
      default: 
        return "#10b981";          
    }
  };

  const particleColor = getParticleColor(systemState);
  const isListening = systemState === 'LISTENING'; 
  const isCyberMode = designMode === "CYBER";

  // Dynamic parameters mapping directly to global design mode selections
  const options = useMemo<any>(() => ({
    background: { color: { value: "#020204" } },
    fpsLimit: 60, 
    interactivity: {
      events: {
        onClick: { enable: false, mode: "push" }, 
        onHover: { enable: true, mode: "grab" }, 
        resize: { enable: true },
      },
      modes: {
        grab: { distance: 150, links: { opacity: 0.5, color: particleColor } },
        push: { quantity: 1 },
      },
    },
    particles: {
      color: { value: particleColor },
      links: {
        color: particleColor,
        distance: 130,
        enable: true,
        // Brighter links for CYBER-grid mode
        opacity: isCyberMode 
          ? (isOverclocked ? 0.65 : (isListening ? 0.15 : 0.55)) 
          : (isOverclocked ? 0.45 : (isListening ? 0.08 : 0.28)),
        // Thickened vector paths for CYBER mode
        width: isCyberMode ? 2.8 : 2.2, 
      },
      move: {
        enable: true,
        // High-velocity acceleration for CYBER data streams
        speed: isCyberMode 
          ? (isListening ? 0.25 : 2.5) 
          : (isOverclocked ? 1.6 : (isListening ? 0.18 : 0.8)), 
      },
      number: {
        // Increased node density for CYBER mode
        value: isCyberMode 
          ? (isOverclocked ? 65 : 45) 
          : (isOverclocked ? 50 : 35), 
      },
      opacity: {
        value: { 
          min: isCyberMode ? 0.22 : 0.18, 
          max: isCyberMode 
            ? (isOverclocked ? 0.8 : (isListening ? 0.18 : 0.6)) 
            : (isOverclocked ? 0.7 : (isListening ? 0.12 : 0.45)) 
        },
      },
      size: {
        value: { 
          min: isCyberMode ? 3.0 : 2.5, 
          max: isCyberMode ? 5.5 : 4.8 
        }, 
      },
    },
    detectRetina: true,
  }), [isOverclocked, particleColor, isListening, isCyberMode]);

  if (!init) return null;
  
  return (
    <div className="absolute inset-0 pointer-events-none -z-30 h-full w-full">
      <Particles id="tsparticles" className="absolute inset-0 z-0 h-full w-full pointer-events-none" options={options} />
    </div>
  );
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#020204] text-white selection:bg-emerald-500/30 overflow-x-hidden relative`}>
        <ThemeProvider>
          {/* @ts-ignore */}
          <ContextProvider cookies={null}>
            <ParticleBackground />
            
            <div className="pointer-events-none fixed inset-0 z-40 h-full w-full bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.18)_50%),linear-gradient(90deg,rgba(255,0,0,0.04),rgba(0,255,0,0.01),rgba(0,0,255,0.04))] bg-[length:100%_4px,3px_100%] opacity-15 mix-blend-overlay"></div>
            
            <div className="relative z-10 pointer-events-auto">
              {children}
            </div>
          </ContextProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
