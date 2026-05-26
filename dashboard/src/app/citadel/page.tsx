/*
“Must always include our chat rule from the beginning of this section to the end the rules and ways in all code outputs and design assets.”
*/

"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import Link from "next/link";
import { useTheme } from "../ThemeContext";
import { useAppKit } from '@reown/appkit/react';
import { useAccount, useSwitchChain, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';

function FloatingGlassCard({ children, className, delay = 0, isAuraActive = true, designMode = "SILENT" }: { children: React.ReactNode, className: string, delay?: number, isAuraActive?: boolean, designMode?: "AURA" | "SILENT" | "CHROME" | "CYBER" }) {
  const { systemState } = useTheme();
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-300, 300], [6, -6]);
  const rotateY = useTransform(x, [-300, 300], [-6, 6]);

  function handleMouse(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    x.set(event.clientX - rect.left - rect.width / 2);
    y.set(event.clientY - rect.top - rect.height / 2);
  }

  return (
    <motion.div
      onMouseMove={handleMouse}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d", perspective: 1200 }}
      animate={{ y: [0, -12, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay }}
      className={`relative rounded-3xl p-[1.5px] overflow-hidden transition-all duration-700 ${className}`}
    >
      {isAuraActive && designMode !== "SILENT" && (
        <div className="absolute top-1/2 left-1/2 w-[220%] h-[220%] -translate-x-1/2 -translate-y-1/2 pointer-events-none -z-10 transition-all duration-700 overflow-hidden">
          <div className={`w-full h-full rounded-full opacity-35 blur-sm scale-95 ${
            systemState === 'OVERCLOCK' ? 'gemini-border-sweeper-overclock' :
            designMode === 'CHROME' ? 'gemini-border-sweeper-chrome' : 'gemini-border-sweeper'
          }`} />
        </div>
      )}
      
      <div 
        style={{ transform: "translateZ(30px)" }} 
        className={`h-full w-full rounded-[23px] transition-all duration-700 p-5 sm:p-7 flex flex-col relative z-10 ${
          designMode === "AURA"
            ? "bg-[rgba(5,7,18,0.55)] backdrop-blur-[60px] shadow-[0_55px_110px_rgba(0,0,0,0.95),inset_0_1.5px_1.5px_rgba(255,255,255,0.12)] border-t border-l border-white/22 border-b border-r border-white/5"
            : designMode === "CHROME"
            ? "bg-gradient-to-br from-indigo-950/40 via-slate-900/55 to-pink-950/40 backdrop-blur-[65px] shadow-[0_55px_110px_rgba(168,85,247,0.25),inset_0_1.5px_2px_rgba(255,255,255,0.2)] border border-purple-500/35 animate-[pulse_6s_ease-in-out_infinite]"
            : designMode === "CYBER"
            ? "bg-black/90 backdrop-blur-[70px] shadow-[0_55px_110px_rgba(0,255,163,0.15),inset_0_1.5px_1.5px_rgba(0,255,163,0.15)] border border-[#00ffa3]/30"
            : "bg-[rgba(10,15,30,0.4)] backdrop-blur-[70px] shadow-[0_40px_80px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.08)] border border-white/15 hover:border-white/30"
        }`}
      >
        {children}
      </div>
    </motion.div>
  );
}

export default function CitadelVault() {
  const [mounted, setMounted] = useState(false);
  
  const { safeColors, setSystemState, isOverclocked, designMode } = useTheme();
  const { primary, border, glow } = safeColors;
  
  // AppKit Hook
  const { open } = useAppKit();

  const { address, isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();

  const [riskLevel, setRiskLevel] = useState("Balanced");
  const [maxDrawdown, setMaxDrawdown] = useState("10");
  const [mintSuccess, setMintSuccess] = useState(false);

  // --- UPGRADE: DYNAMIC BOT-CREATED IDENTITY BLUEPRINT BRIDGE ---
  const [pendingBotIdentity, setPendingBotIdentity] = useState<{ riskStrategy: string, maxDrawdown: number } | null>(null);
  const [isFetchingBot, setIsFetchingBot] = useState(false);

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  // Prevent hydration mismatch by waiting for mount
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => { 
    if (mounted && !isOverclocked) setSystemState('IDLE'); 
  }, [setSystemState, isOverclocked, mounted]);

  // Sync virtual bot profile configurations
  useEffect(() => {
    if (mounted && isConnected && address) {
      const fetchBotDraftedProfile = async () => {
        setIsFetchingBot(true);
        try {
          const response = await fetch(`https://mantle-agentic-core.onrender.com/api/bot/virtual-identity?wallet_address=${address.toLowerCase()}`);
          const data = await response.json();
          if (data.status === "pending") {
            setPendingBotIdentity({
              riskStrategy: data.riskStrategy,
              maxDrawdown: data.maxDrawdown
            });
            // Automatically prefill forms
            setRiskLevel(data.riskStrategy);
            setMaxDrawdown(data.maxDrawdown.toString());
          } else {
            setPendingBotIdentity(null);
          }
        } catch (err) {
          console.error("Failed to fetch pending bot virtual identity", err);
        } finally {
          setIsFetchingBot(false);
        }
      };
      fetchBotDraftedProfile();
    } else {
      setPendingBotIdentity(null);
    }
  }, [address, isConnected, mounted]);

  useEffect(() => {
    if (isConfirmed && address && mounted) {
      const mintedProfile = {
        riskStrategy: riskLevel,
        maxDrawdown: Number(maxDrawdown),
        birthTimestamp: Date.now(),
        isAutonomous: true
      };
      
      localStorage.setItem(`mac_agent_${address.toLowerCase()}`, JSON.stringify(mintedProfile));
      
      setMintSuccess(true);
      setTimeout(() => {
        if (!isOverclocked) setSystemState('IDLE');
      }, 5000); 
    }
  }, [isConfirmed, address, riskLevel, maxDrawdown, setSystemState, isOverclocked, mounted]);

  const handleMintAgent = async () => {
    setSystemState('MINTING');
    try {
      writeContract({
        address: '0x1E5B64264089aacC547A1506402B94f909215942', 
        abi: [{
            inputs: [{ internalType: "string", name: "_riskStrategy", type: "string" }, { internalType: "uint256", name: "_maxDrawdown", type: "uint256" }],
            name: "mintAgentIdentity",
            outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
            stateMutability: "nonpayable",
            type: "function"
        }],
        functionName: 'mintAgentIdentity',
        args: [riskLevel, BigInt(maxDrawdown)],
      });
    } catch (err) {
      if (!isOverclocked) setSystemState('IDLE');
      console.error("Transaction initiation failed", err);
    }
  };

  if (!mounted) return null;

  return (
    <main className={`min-h-screen relative p-4 md:p-8 lg:p-12 z-10 overflow-x-hidden flex flex-col items-center justify-center bg-transparent transition-all duration-1000 ${
      isOverclocked 
        ? 'shadow-[inset_0_0_120px_rgba(239,68,68,0.22)] bg-red-950/10' 
        : ''
    }`}>
      
      {/* NATIVE GLOWING CYBER-NODES BACKGROUND */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-20 opacity-45">
        <div className="absolute top-[20%] left-[15%] w-2 h-2 rounded-full bg-emerald-500 animate-ping [animation-duration:3s]" />
        <div className="absolute top-[60%] left-[80%] w-2.5 h-2.5 rounded-full bg-purple-500 animate-ping [animation-duration:4s]" />
        
        <svg className="absolute inset-0 w-full h-full stroke-white/5 stroke-[0.8]" xmlns="http://www.w3.org/2000/svg">
          <line x1="15%" y1="20%" x2="45%" y2="40%" />
          <line x1="45%" y1="40%" x2="80%" y2="60%" />
          <line x1="15%" y1="20%" x2="25%" y2="80%" />
        </svg>
      </div>

      {isOverclocked && (
        <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.15)_0%,rgba(0,0,0,0.9)_100%)] pointer-events-none -z-15 transition-all duration-1000 animate-pulse" />
      )}

      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none transition-colors duration-1000">
        <div className={`absolute top-[-20%] left-[-10%] w-[60%] h-[60%] ${glow} blur-[150px] rounded-full transition-all duration-1000 opacity-60`} />
      </div>

      <div className="max-w-6xl w-full">
        <div className="flex justify-between items-end mb-8 border-b border-white/15 pb-6">
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-white uppercase mb-1 drop-shadow-md text-sharp-primary">
              BUIDL <span className={primary}>CITADEL</span>
            </h1>
            <p className="text-white/80 uppercase tracking-[0.25em] text-[10px] font-mono font-black">
              // ERC-8004 Identity Minting & Control Terminal //
            </p>
          </div>
          
          <Link href="/" className="pointer-events-auto z-50">
            <button className="px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest text-white/90 transition-all duration-300 border border-white/20 bg-white/5 hover:bg-white/15 hover:border-white/40 hover:shadow-[0_0_15px_rgba(255,255,255,0.15)] mobile-touch-target">
              &lt; Return to Terminal
            </button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-6">
            
            {/* GLOWING DYNAMIC BOT DETECTOR NOTICE CARD */}
            <AnimatePresence>
              {pendingBotIdentity && !mintSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="bg-purple-950/20 border border-purple-500/40 p-5 rounded-3xl backdrop-blur-2xl shadow-[0_0_30px_rgba(168,85,247,0.25)] flex items-center gap-4 relative overflow-hidden">
                    <div className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-ping flex-shrink-0" />
                    <div>
                      <span className="text-[10px] font-black tracking-widest text-purple-400 uppercase block mb-1">🧬 DNA Blueprint Detected from Bot Relay!</span>
                      <p className="text-xs text-white/90 font-mono leading-relaxed font-bold">
                        Your drafted profile configured via chat is ready for blockchain activation: 
                        Strategy: **{pendingBotIdentity.riskStrategy}**, Max Drawdown: **{pendingBotIdentity.maxDrawdown}%**. 
                        Click &apos;AWAKEN AGENT IDENTITY&apos; to mint and lock this configuration on-chain!
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <FloatingGlassCard designMode={designMode} className={`bg-white/5 backdrop-blur-3xl border ${border} rounded-3xl p-8 shadow-[0_30px_60px_rgba(0,0,0,0.65)] transition-colors duration-700 ease-out`}>
              <AnimatePresence mode="wait">
                {!mintSuccess ? (
                  <motion.div 
                    key="form"
                    initial={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-4">
                      <div className="bg-black/40 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-[inset_0_0_20px_rgba(0,0,0,0.6)] space-y-4">
                        <h3 className="text-white font-black uppercase tracking-widest text-sm border-b border-white/10 pb-2 text-sharp-primary">
                          Agent Parameters
                        </h3>
                        
                        <div className="space-y-2">
                          <label className="text-[10px] font-black font-mono text-white/80 block uppercase tracking-wider">RISK MANAGEMENT STRATEGY</label>
                          <select 
                            value={riskLevel} 
                            onChange={(e) => setRiskLevel(e.target.value)}
                            onFocus={() => !isOverclocked && setSystemState('LISTENING')}
                            onBlur={() => !isOverclocked && setSystemState('IDLE')}
                            className="w-full bg-black/60 border border-white/20 rounded-xl px-4 py-3.5 text-sm text-white font-bold focus:outline-none focus:border-[#00ffa3]/50 transition-all mobile-touch-target relative z-50 pointer-events-auto"
                          >
                            <option value="Conservative">Conservative (RWA Aggregator)</option>
                            <option value="Balanced">Balanced (DeFi LP Sweeper)</option>
                            <option value="Aggressive">Aggressive (Degen Perps Mode)</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black font-mono text-white/80 block uppercase tracking-wider">MAX TRADING DRAWDOWN (%)</label>
                          <input 
                            type="number" 
                            value={maxDrawdown}
                            onChange={(e) => setMaxDrawdown(e.target.value)}
                            onFocus={() => !isOverclocked && setSystemState('LISTENING')}
                            onBlur={() => !isOverclocked && setSystemState('IDLE')}
                            className="w-full bg-black/60 border border-white/20 rounded-xl px-4 py-3.5 text-sm text-white font-bold focus:outline-none focus:border-[#00ffa3]/50 transition-all pointer-events-auto"
                            min="1" max="100"
                          />
                        </div>
                      </div>

                      <div className="bg-black/40 border border-white/10 rounded-2xl p-6 flex flex-col justify-between backdrop-blur-xl shadow-[inset_0_0_20px_rgba(0,0,0,0.6)]">
                        <div>
                          <h3 className="text-white font-black uppercase tracking-widest text-sm border-b border-white/10 pb-2 mb-4 text-sharp-primary">
                            On-Chain Identity Status
                          </h3>
                          <p className="text-xs font-mono text-white/90 leading-relaxed mb-4 font-bold">
                            Deploying your agent configurations registry to Mantle updates the ERC-8004 standard registry via your active wallet.
                          </p>
                          
                          <div className="font-mono text-xs space-y-2 bg-black/50 p-4 rounded-xl border border-white/10 shadow-inner">
                            <div className="text-white/70 font-black">TARGET NETWORK: <span className="text-white font-black">Mantle Sepolia</span></div>
                            <div className="text-white/70 font-black">REGISTRY: <span className="text-purple-400 font-black">0x1E5B...5942</span></div>
                            <div className="text-white/70 mt-2 font-black">AUTH STATUS: <span className={isConnected ? "text-emerald-400 drop-shadow-[0_0_5px_currentColor] font-black" : "text-red-400 font-black"}>{isConnected ? "CONNECTED" : "DISCONNECTED"}</span></div>
                          </div>
                        </div>

                        <div className="mt-6">
                          {!isConnected ? (
                            <button disabled className="w-full py-3.5 bg-white/5 border border-white/10 rounded-xl text-xs font-black uppercase text-white/30 cursor-not-allowed">
                              Awaiting Node Connection
                            </button>
                          ) : chainId !== 5003 ? (
                            <button
                              onClick={() => switchChain({ chainId: 5003 })}
                              className="w-full py-3.5 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all mobile-touch-target shadow-md"
                            >
                              SWITCH TO MANTLE SEPOLIA
                            </button>
                          ) : (
                            <button
                              onClick={handleMintAgent}
                              disabled={isPending || isConfirming}
                              className={`w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-widest text-white transition-all duration-300 shadow-[0_10px_20px_rgba(0,0,0,0.3)] hover:-translate-y-1 active:scale-95 mobile-touch-target ${
                                isPending || isConfirming 
                                  ? 'bg-purple-600/50 text-white/50 cursor-not-allowed transform-none' 
                                  : 'bg-purple-600 hover:bg-purple-500 shadow-[0_0_20px_rgba(147,51,234,0.4)] hover:shadow-[0_0_30px_rgba(147,51,234,0.6)]'
                              }`}
                            >
                              {isPending ? "SIGNING TRANSACTION..." : isConfirming ? "WRITING TO BLOCKCHAIN..." : "AWAKEN AGENT IDENTITY"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="hologram"
                    initial={{ opacity: 0, scale: 0.5, rotateY: -90 }}
                    animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                    transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.2 }}
                    className="flex flex-col items-center justify-center py-10"
                  >
                    <div className="relative w-full max-w-lg perspective-1000">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-600/40 rounded-full blur-[80px] animate-pulse" />
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-emerald-500/30 rounded-full blur-[60px] animate-[pulse_3s_ease-in-out_infinite]" />

                      <motion.div 
                        animate={{ y: [-10, 10, -10] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="relative z-10 bg-black/40 backdrop-blur-3xl border border-white/25 p-8 rounded-3xl shadow-[0_0_50px_rgba(147,51,234,0.5)] overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0)_50%,rgba(255,255,255,0.05)_50%)] bg-[length:100%_4px] pointer-events-none mix-blend-overlay opacity-50" />
                        
                        <div className="text-center">
                          <div className="inline-block px-4 py-1.5 rounded-full border border-emerald-500/50 bg-emerald-500/10 text-emerald-400 text-[10px] font-black tracking-[0.2em] uppercase mb-6 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                            Registry Synchronized
                          </div>
                          
                          <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-emerald-400 uppercase tracking-widest drop-shadow-[0_0_10px_rgba(147,51,234,0.5)] mb-2 text-sharp-primary">
                            Agent ID Created
                          </h2>
                          
                          <p className="text-white/90 font-mono text-xs mb-8 break-all px-4 bg-black/50 py-3.5 rounded-lg border border-white/10 font-black">
                            Tx: {hash}
                          </p>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/5 border border-white/10 rounded-xl p-4 shadow-md">
                              <span className="block text-[9px] uppercase tracking-widest text-white/50 mb-1.5 font-bold">Encoded Strategy</span>
                              <span className="text-sm font-black text-white">{riskLevel}</span>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-xl p-4 shadow-md">
                              <span className="block text-[9px] uppercase tracking-widest text-white/50 mb-1.5 font-bold">Hard Stop Parameter</span>
                              <span className="text-sm font-black text-red-400">{maxDrawdown}% Drawdown</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </FloatingGlassCard>
          </div>

          <div className="space-y-6">
            <FloatingGlassCard designMode={designMode} className={`bg-white/5 backdrop-blur-3xl p-6 border ${border} rounded-3xl shadow-[0_30px_60px_rgba(0,0,0,0.5)]`}>
              <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-white/50 mb-6 border-b border-white/15 pb-4">
                Bridge Wallet Link
              </h3>
              <p className="text-xs text-white leading-relaxed mb-6 font-bold">
                Establish secure cryptographical signatures to synchronize risk modules with the Mantle Sepolia Ledger.
              </p>
              
              <button 
                onClick={() => open()}
                className="w-full py-4 rounded-2xl bg-white text-black hover:bg-[#00ffa3] hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all font-black text-xs uppercase tracking-widest mobile-touch-target"
              >
                {isConnected ? "Wallet Synchronized" : "Connect Wallet"}
              </button>
            </FloatingGlassCard>
          </div>
        </div>
      </div>
    </main>
  );
}