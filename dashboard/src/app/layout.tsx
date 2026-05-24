/*
“Must always include our chat rule from the beginning of this section to the end the rules and ways in all code outputs and design assets.”
*/

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
  // Pulling the global nervous system states
  const { isOverclocked, systemState } = useTheme();
  const [init, setInit] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => setInit(true));
  }, []);

  // Map the semantic aura states to soft, low-brightness colors for particles
  const getParticleColor = (state: string) => {
    switch (state) {
      case 'OVERCLOCK': 
        return "#ef4444"; // Soft Crimson Red
      case 'ANALYZING': 
        return "#f59e0b"; // Soft Amber
      case 'MINTING': 
        return "#a855f7";   // Soft Violet
      case 'LISTENING': 
        return "#10b981"; // Soft Emerald
      case 'IDLE':
      default: 
        return "#10b981";          // Soft Emerald
    }
  };

  const particleColor = getParticleColor(systemState);
  const isListening = systemState === 'LISTENING'; // Triggers the "Silence" mode

  const options = useMemo<any>(() => ({
    background: { color: { value: "#020204" } },
    fpsLimit: 60, // Optimized for smooth rendering on mobile chipsets
    interactivity: {
      events: {
        onClick: { enable: false, mode: "push" }, // Disabled on mobile to prevent canvas stealing tap coordinates
        onHover: { enable: true, mode: "grab" }, 
        resize: { enable: true },
      },
      modes: {
        grab: { distance: 130, links: { opacity: 0.3, color: particleColor } },
        push: { quantity: 1 },
      },
    },
    particles: {
      color: { value: particleColor },
      links: {
        color: particleColor,
        distance: 120,
        enable: true,
        // Particles dim significantly when listening for input
        opacity: isOverclocked ? 0.3 : (isListening ? 0.03 : 0.15),
        width: 1,
      },
      move: {
        enable: true,
        // Particles physically slow down to a crawl when listening to free up render cycles
        speed: isOverclocked ? 1.5 : (isListening ? 0.15 : 0.6), 
      },
      number: {
        value: isOverclocked ? 45 : 30, // Optimized particle count to maintain 60FPS on low-end mobile devices
      },
      opacity: {
        value: { min: 0.05, max: isOverclocked ? 0.6 : (isListening ? 0.08 : 0.3) },
      },
      size: {
        value: { min: 1, max: 2 },
      },
    },
    detectRetina: true,
  }), [isOverclocked, particleColor, isListening]);

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
            
            {/* The cinematic CRT overlay (adds depth and glass texture, clicks pass through smoothly) */}
            <div className="pointer-events-none fixed inset-0 z-40 h-full w-full bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.15)_50%),linear-gradient(90deg,rgba(255,0,0,0.04),rgba(0,255,0,0.01),rgba(0,0,255,0.04))] bg-[length:100%_4px,3px_100%] opacity-15 mix-blend-overlay"></div>
            
            {/* Main Interactive Child Container */}
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