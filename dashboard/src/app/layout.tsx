"use client";

import "./globals.css";
import { Inter } from "next/font/google";
import { ThemeProvider, useTheme } from "./ThemeContext";
import ContextProvider from "../context";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import React, { useEffect, useState, useMemo } from "react";
import { Analytics } from "@vercel/analytics/next";

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

  // Map the semantic aura states to actual Hex colors for the particles
  const getParticleColor = (state: string) => {
    switch(state) {
      case 'OVERCLOCK': return "#ef4444"; // Crimson Red
      case 'ANALYZING': return "#f59e0b"; // Gold/Amber
      case 'MINTING': return "#a855f7";   // Deep Violet
      case 'LISTENING': return "#10b981"; // Emerald
      case 'IDLE':
      default: return "#10b981";          // Emerald
    }
  };

  const particleColor = getParticleColor(systemState);
  const isListening = systemState === 'LISTENING'; // Triggers the "Silence" mode

  const options = useMemo<any>(() => ({
    background: { color: { value: "#000000" } },
    fpsLimit: 60, // OPTIMIZED for smooth rendering
    interactivity: {
      events: {
        onClick: { enable: true, mode: "push" },
        onHover: { enable: true, mode: "grab" }, 
        resize: { enable: true },
      },
      modes: {
        grab: { distance: 150, links: { opacity: 0.5, color: particleColor } },
        push: { quantity: 2 },
      },
    },
    particles: {
      color: { value: particleColor },
      links: {
        color: particleColor,
        distance: 150,
        enable: true,
        // Particles dim significantly when listening for input
        opacity: isOverclocked ? 0.5 : (isListening ? 0.05 : 0.2),
        width: 1,
      },
      move: {
        enable: true,
        // Particles physically slow down to a crawl when listening
        speed: isOverclocked ? 2 : (isListening ? 0.2 : 0.8), 
      },
      number: {
        value: isOverclocked ? 60 : 40, 
      },
      opacity: {
        value: { min: 0.1, max: isOverclocked ? 0.8 : (isListening ? 0.1 : 0.4) },
      },
      size: {
        value: { min: 1, max: 2 },
      },
    },
    detectRetina: true,
  }), [isOverclocked, particleColor, isListening]);

  if (!init) return <></>;
  
  return (
    <Particles id="tsparticles" className="fixed inset-0 z-0 h-full w-full pointer-events-none" options={options} />
  );
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-black text-white selection:bg-emerald-500/30`}>
        <ThemeProvider>
          {/* @ts-ignore */}
          <ContextProvider cookies={null}>
            <ParticleBackground />
            
            {/* The cinematic CRT overlay (adds depth and glass texture) */}
            <div className="pointer-events-none fixed inset-0 z-40 h-full w-full bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] opacity-10 mix-blend-overlay"></div>
            
            <div className="relative z-50">{children}</div>
          </ContextProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}