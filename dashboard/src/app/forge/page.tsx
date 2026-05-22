"use client";

import React, { useState, useEffect } from "react";
import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useTheme } from "../ThemeContext";
import { useAppKit } from '@reown/appkit/react';
import { useAccount, useSwitchChain, useDeployContract, useWaitForTransactionReceipt } from 'wagmi';

function FloatingGlassCard({ children, className, delay = 0 }: { children: React.ReactNode, className: string, delay?: number }) {
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
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay }}
      className={`relative group ${className}`}
    >
      <div className="absolute inset-0 rounded-3xl border-t border-l border-white/20 pointer-events-none mix-blend-overlay z-20" />
      <div style={{ transform: "translateZ(30px)" }} className="h-full w-full flex flex-col relative z-10">
        {children}
      </div>
    </motion.div>
  );
}

export default function NeuralForge() {
  const { safeColors, setSystemState, isOverclocked } = useTheme();
  const { border, glow } = safeColors;
  
  // AppKit Hook
  const { open } = useAppKit();

  const { isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();

  const [blueprint, setBlueprint] = useState("");
  const [isForging, setIsForging] = useState(false);
  const [output, setOutput] = useState("// Awaiting smart contract parameters or raw code for audit...");

  // LAUNCHPAD STATE MODULES
  const [deployableABI, setDeployableABI] = useState<any[] | null>(null);
  const [deployableBytecode, setDeployableBytecode] = useState<string | null>(null);
  const [contractName, setContractName] = useState<string | null>(null);

  const { deployContract, data: deployHash, isPending: isDeploying } = useDeployContract();
  const { isLoading: isTxConfirming, isSuccess: isDeployed, data: receipt } = useWaitForTransactionReceipt({ hash: deployHash });

  useEffect(() => { 
    if (!isOverclocked) setSystemState('IDLE'); 
  }, [setSystemState, isOverclocked]);

  const handleForge = async () => {
    if (!blueprint.trim()) return;
    setIsForging(true);
    setSystemState('ANALYZING');
    setDeployableABI(null);
    setDeployableBytecode(null);
    setContractName(null);
    setOutput("// Compiling dependencies and initiating SecOps audit...\n// Querying Mantle core neural models...");
    
    try {
      const response = await fetch("https://mantle-agentic-core.onrender.com/api/forge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: blueprint }),
      });
      const data = await response.json();
      
      if (data.status === "success" || data.message) {
        setOutput(data.message);
        
        if (data.bytecode && data.abi) {
          setDeployableABI(data.abi);
          setDeployableBytecode(data.bytecode);
          setContractName(data.contract_name || "Mantle Custom Contract");
        }
      } else {
        setOutput(`// FORGE SCAN ERROR:\n${data.message}`);
      }
    } catch (err) {
      setOutput("// COMPILER ERROR: Failed to establish context stream with Neural Forge.\n// Please verify FastAPI is running at https://mantle-agentic-core.onrender.com.");
    } finally {
      setIsForging(false);
      if (!isOverclocked) setSystemState('IDLE');
    }
  };

  const handleDeployContract = async () => {
    if (!deployableABI || !deployableBytecode) return;
    setSystemState('MINTING');
    try {
      // UPGRADE: Fixed native BigInt literal with standard constructor
      deployContract({
        abi: deployableABI,
        bytecode: deployableBytecode as `0x${string}`,
        args: [],
        gas: BigInt(1500000)
      });
    } catch (err) {
      console.error("Contract deployment failed:", err);
      if (!isOverclocked) setSystemState('IDLE');
    }
  };

  useEffect(() => {
    if (isDeployed) {
      setTimeout(() => {
        if (!isOverclocked) setSystemState('IDLE');
      }, 4000);
    }
  }, [isDeployed, isOverclocked, setSystemState]);

  return (
    <main className="min-h-screen relative p-4 md:p-8 lg:p-12 z-0 overflow-x-hidden flex flex-col items-center bg-transparent font-sans">
      
      {/* NATIVE GLOWING CYBER-NODES BACKGROUND */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-20 opacity-35">
        <div className="absolute top-[10%] left-[20%] w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping [animation-duration:4s]" />
        <div className="absolute top-[70%] left-[75%] w-2 h-2 rounded-full bg-purple-500 animate-ping [animation-duration:3s]" />
        <div className="absolute top-[50%] left-[30%] w-1 h-1 rounded-full bg-blue-400 animate-ping [animation-duration:6s]" />
        <div className="absolute top-[85%] left-[10%] w-2 h-2 rounded-full bg-emerald-400 animate-ping [animation-duration:3.2s]" />
        
        <svg className="absolute inset-0 w-full h-full stroke-white/5 stroke-[0.5]" xmlns="http://www.w3.org/2000/svg">
          <line x1="20%" y1="10%" x2="30%" y2="50%" />
          <line x1="30%" y1="50%" x2="75%" y2="70%" />
          <line x1="20%" y1="10%" x2="10%" y2="85%" />
        </svg>
      </div>

      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none transition-colors duration-1000">
        <div className={`absolute top-[-20%] left-[-10%] w-[60%] h-[60%] ${glow} blur-[150px] rounded-full transition-all duration-1000 opacity-60`} />
      </div>

      <div className="max-w-6xl w-full mt-10">
        <div className="flex justify-between items-end mb-8 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-white uppercase mb-1 drop-shadow-md">
              NEURAL <span className="text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.4)]">FORGE</span>
            </h1>
            <p className="text-white/40 uppercase tracking-[0.2em] text-[10px] font-mono">
              Autonomous Smart Contract Auditor & Compiler
            </p>
          </div>
          
          <Link href="/">
            <button className="px-6 py-2 rounded-xl font-bold text-xs uppercase tracking-widest text-white/50 transition-all duration-300 border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/30 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]">
              &lt; Return to Main
            </button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          <div className="lg:col-span-2 flex flex-col gap-6">
            <FloatingGlassCard className={`bg-white/5 backdrop-blur-3xl border ${border} rounded-3xl overflow-hidden flex-1 flex flex-col shadow-[0_30px_60px_rgba(0,0,0,0.5)] transition-colors duration-500`}>
              <div className="bg-black/20 px-6 py-4 border-b border-white/5 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500">Input Blueprint</span>
              </div>
              <textarea 
                value={blueprint}
                onChange={(e) => setBlueprint(e.target.value)}
                onFocus={() => !isOverclocked && setSystemState('LISTENING')}
                onBlur={() => !isOverclocked && setSystemState('IDLE')}
                placeholder="Paste raw Solidity code to audit vulnerabilities, OR type a prompt to generate a new smart contract..."
                className="w-full bg-transparent text-white font-mono text-sm p-6 focus:outline-none resize-none flex-1 min-h-[300px]"
              />
            </FloatingGlassCard>
            
            <FloatingGlassCard delay={0.2} className="h-[70px] bg-transparent">
              <button 
                onClick={handleForge}
                disabled={isForging || !blueprint.trim()}
                className={`w-full h-full rounded-3xl font-black text-sm uppercase tracking-widest transition-all duration-300 shadow-[0_20px_40px_rgba(0,0,0,0.3)] ${
                  isForging || !blueprint.trim()
                    ? 'bg-white/10 text-white/30 cursor-not-allowed'
                    : 'bg-amber-500 text-black hover:bg-amber-400 shadow-[0_20px_40px_rgba(245,158,11,0.3)] hover:shadow-[0_20px_40px_rgba(245,158,11,0.5)] active:scale-95'
                }`}
              >
                {isForging ? "Forging Codebase..." : "Initiate Forge"}
              </button>
            </FloatingGlassCard>
          </div>

          <div className="flex flex-col gap-6">
            <FloatingGlassCard delay={0.4} className={`bg-white/5 backdrop-blur-3xl border ${border} rounded-3xl overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.5)] flex flex-col h-[350px] transition-colors duration-500`}>
              <div className="bg-black/20 px-6 py-4 border-b border-white/5 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-3 border-b border-white/10 pb-2">
                  Forge Output Log
                </span>
                <div className="w-1.5 h-1.5 rounded-full bg-white/20 animate-pulse" />
              </div>
              <div className="p-6 font-mono text-xs text-amber-500/90 whitespace-pre-wrap overflow-y-auto flex-1 leading-relaxed scrollbar-hide">
                {output}
              </div>
            </FloatingGlassCard>

            {/* MANTLE DEPLOYMENT LAUNCHPAD HUD */}
            <AnimatePresence>
              {deployableBytecode && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ duration: 0.4 }}
                >
                  <FloatingGlassCard delay={0.5} className="bg-black/40 border border-purple-500/30 rounded-3xl p-6 shadow-[0_0_30px_rgba(168,85,247,0.2)]">
                    <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-4">
                      <span className="text-[10px] font-black tracking-widest text-purple-400 uppercase flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" /> Mantle Deployer Active
                      </span>
                      <span className="text-[9px] font-mono text-white/40">Target: Mantle Sepolia (5003)</span>
                    </div>

                    <div className="space-y-2 mb-6">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-white/40">CONTRACT NAME:</span>
                        <span className="text-white font-bold">{contractName}</span>
                      </div>
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-white/40">COMPILER STATUS:</span>
                        <span className="text-emerald-400">SecOps Mapped & Compiled</span>
                      </div>
                      {isDeployed && receipt && (
                        <div className="flex flex-col text-xs font-mono bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-lg gap-1">
                          <span className="text-emerald-400 font-bold block">🚀 DEPLOYMENT SUCCESSFUL</span>
                          <span className="text-[10px] text-white/50 block break-all">ADDRESS: {receipt.contractAddress}</span>
                          <a 
                            href={`https://explorer.sepolia.mantle.xyz/address/${receipt.contractAddress}`}
                            target="_blank" rel="noopener noreferrer"
                            className="text-[10px] text-purple-400 underline hover:text-purple-300 block mt-1"
                          >
                            View on Mantle Sepolia Explorer &gt;
                          </a>
                        </div>
                      )}
                    </div>

                    {!isDeployed && (
                      <div>
                        {!isConnected ? (
                          <div className="text-center p-3 bg-white/5 border border-white/5 rounded-xl text-[10px] text-white/40 font-mono">
                            Please connect your wallet to enable Mantle deployment.
                          </div>
                        ) : chainId !== 5003 ? (
                          <button
                            onClick={() => switchChain({ chainId: 5003 })}
                            className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all"
                          >
                            SWITCH TO MANTLE SEPOLIA
                          </button>
                        ) : (
                          <button
                            onClick={handleDeployContract}
                            disabled={isDeploying || isTxConfirming}
                            className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-widest text-white transition-all duration-300 ${
                              isDeploying || isTxConfirming
                                ? 'bg-purple-600/50 text-white/50 cursor-not-allowed'
                                : 'bg-purple-600 hover:bg-purple-500 shadow-[0_0_20px_rgba(147,51,234,0.4)]'
                            }`}
                          >
                            {isDeploying ? "SIGNING DEPLOYMENT..." : isTxConfirming ? "MINING CONTRACT ON-CHAIN..." : "LAUNCH ON MANTLE SEPOLIA"}
                          </button>
                        )}
                      </div>
                    )}
                  </FloatingGlassCard>
                </motion.div>
              )}
            </AnimatePresence>

            {/* SYNCED BRIDGE WALLET CARD MODULE */}
            <FloatingGlassCard className={`bg-white/5 backdrop-blur-3xl p-6 border ${border} rounded-3xl shadow-[0_30px_60px_rgba(0,0,0,0.5)]`}>
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-6 border-b border-white/10 pb-4">
                Bridge Wallet Link
              </h3>
              <p className="text-xs text-white/50 font-mono leading-relaxed mb-6">
                Connect your active signature wallet to authorize deployment payloads directly inside the Neural Forge.
              </p>
              
              <button 
                onClick={() => open()}
                className="w-full py-4 rounded-2xl bg-white text-black hover:bg-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all font-black text-xs uppercase tracking-widest"
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