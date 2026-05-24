/*
“Must always include our chat rule from the beginning of this section to the end the rules and ways in all code outputs and design assets.”
*/

"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { useAppKit, useAppKitAccount } from '@reown/appkit/react';
import Link from "next/link"; 
import { useTheme } from "./ThemeContext"; 
import { createPublicClient, http, parseAbiItem } from "viem";
import { useWriteContract, useWaitForTransactionReceipt, useBalance } from "wagmi";

// --- STRONGLY-TYPED ABI CONSTANT FOR VIEM COMPILER RESOLUTION ---
const ERC8004_IDENTITY_ABI = [
  {
    inputs: [{ internalType: "uint256", name: "agentId", type: "uint256" }],
    name: "getAgentProfile",
    outputs: [
      {
        components: [
          { internalType: "string", name: "riskStrategy", type: "string" },
          { internalType: "uint256", name: "maxDrawdown", type: "uint256" },
          { internalType: "uint256", name: "birthTimestamp", type: "uint256" },
          { internalType: "bool", name: "isAutonomous", type: "bool" }
        ],
        internalType: "struct ERC8004Identity.AgentProfile",
        name: "",
        type: "tuple"
      }
    ],
    stateMutability: "view",
    type: "function"
  }
] as const;

// --- TYPES FOR LIVE PNL TRACKING ---
type ActivePosition = {
  id: string;
  asset: string;
  pair: string;
  type: 'LONG' | 'SHORT' | 'SWAP';
  leverage: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercentage: number;
};

type ActionPayload = {
  asset: string;
  pair: string;
  type: 'LONG' | 'SHORT' | 'SWAP';
  leverage: number;
  status: 'PENDING' | 'EXECUTING' | 'SUCCESS';
  confidence: number;
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  analysis: string;
};

type AgentOnChainProfile = {
  riskStrategy: string;
  maxDrawdown: number;
  birthTimestamp: number;
  isAutonomous: boolean;
};

type Message = { 
  id: string; 
  role: "system" | "user" | "ai" | "error"; 
  text: string; 
  actionPayload?: ActionPayload; 
  thinkingSteps?: string[];
  latency?: string;
  decisionHash?: string;
};

type RelayPingLog = {
  id: string;
  agent: "Yield Scribe" | "Sentinel Hub" | "Alpha Trace";
  color: string;
  text: string;
};

function FloatingGlassCard({ children, className, delay = 0, isAuraActive = true, designMode = "AURA" }: { children: React.ReactNode, className: string, delay?: number, isAuraActive?: boolean, designMode?: "AURA" | "SILENT" | "CHROME" }) {
  const { systemState } = useTheme();
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-300, 300], [4, -4]); // Moderate angular rotation for legible viewport rendering
  const rotateY = useTransform(x, [-300, 300], [-4, 4]);

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
      animate={{ y: [0, -6, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay }}
      className={`relative rounded-3xl p-[1px] overflow-hidden transition-all duration-700 ${className}`}
    >
      {isAuraActive && designMode !== "SILENT" && (
        <div className={`absolute top-1/2 left-1/2 w-[220%] h-[220%] -translate-x-1/2 -translate-y-1/2 pointer-events-none -z-10 transition-all duration-700 overflow-hidden`}>
          <div className={`w-full h-full rounded-full opacity-35 blur-sm scale-95 ${
            systemState === 'OVERCLOCK' ? 'gemini-border-sweeper-overclock' :
            designMode === 'CHROME' ? 'gemini-border-sweeper-chrome' : 'gemini-border-sweeper'
          }`} />
        </div>
      )}
      
      <div 
        style={{ transform: "translateZ(25px)" }} 
        className={`h-full w-full rounded-[23px] transition-all duration-700 p-4 sm:p-6 flex flex-col relative z-10 ${
          designMode === "AURA"
            ? "bg-[rgba(5,7,18,0.45)] backdrop-blur-[50px] shadow-[0_40px_80px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.08)] border-t border-l border-white/15 border-b border-r border-white/5"
            : designMode === "CHROME"
            ? "bg-gradient-to-br from-indigo-950/30 via-slate-900/40 to-pink-950/30 backdrop-blur-[55px] shadow-[0_40px_80px_rgba(168,85,247,0.15),inset_0_1px_2px_rgba(255,255,255,0.15)] border border-purple-500/25 animate-[pulse_8s_ease-in-out_infinite]"
            : "bg-[rgba(15,22,42,0.3)] backdrop-blur-[55px] shadow-[0_30px_60px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.05)] border border-white/10 hover:border-white/20"
        }`}
      >
        {children}
      </div>
    </motion.div>
  );
}

function IntroSequence({ onComplete, designMode = "AURA" }: { onComplete: () => void, designMode?: "AURA" | "SILENT" | "CHROME" }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
      transition={{ duration: 0.8 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xl"
    >
      <FloatingGlassCard designMode={designMode} className="max-w-2xl w-full text-center">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-emerald-400 to-blue-500 blur-[1px] shadow-[0_0_30px_rgba(16,185,129,0.4)] flex items-center justify-center border border-white/20">
            <div className="w-10 h-10 bg-black rounded-xl animate-pulse" />
          </div>
          <h1 className="text-3xl font-black text-white uppercase tracking-widest mb-2">Mantle <span className="text-emerald-400">Agentic</span> Core</h1>
          <p className="text-white/85 font-mono text-xs mb-10">Autonomous Web3 Operations Ecosystem</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10 text-left">
          <motion.div initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="bg-black/50 p-5 rounded-2xl border border-white/5">
            <h3 className="text-emerald-400 font-bold text-xs uppercase mb-2 tracking-widest">01. Live Terminal</h3>
            <p className="text-white/80 text-[10px] font-mono leading-relaxed">Real-time market analysis and agentic execution.</p>
          </motion.div>
          <motion.div initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="bg-black/50 p-5 rounded-2xl border border-white/5">
            <h3 className="text-amber-400 font-bold text-xs uppercase mb-2 tracking-widest">02. Neural Forge</h3>
            <p className="text-white/80 text-[10px] font-mono leading-relaxed">Autonomous smart contract compilation and auditing.</p>
          </motion.div>
          <motion.div initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }} className="bg-black/50 p-5 rounded-2xl border border-white/5">
            <h3 className="text-purple-400 font-bold text-xs uppercase mb-2 tracking-widest">03. Citadel Vault</h3>
            <p className="text-white/80 text-[10px] font-mono leading-relaxed">ERC-8004 Agent Identity minting and risk management.</p>
          </motion.div>
        </div>

        <motion.button 
          onClick={onComplete}
          className="bg-white text-black font-black uppercase tracking-[0.2em] text-xs px-10 py-3.5 rounded-full hover:bg-emerald-400 hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-all transform hover:scale-105 active:scale-95 mobile-touch-target"
        >
          Initialize System
        </motion.button>
      </FloatingGlassCard>
    </motion.div>
  );
}

function ReasoningLogsHUD({ steps, latency }: { steps: string[], latency?: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-white/10 rounded-xl overflow-hidden bg-black/60 mb-2">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center px-4 py-2.5 text-[10px] font-mono text-purple-400 hover:bg-white/10 transition-all uppercase tracking-widest border-b border-white/5 mobile-touch-target"
      >
        <span className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
          Proof-of-Reasoning Trace
        </span>
        <span>{latency ? `Latency: ${latency}` : "Log Sync"} &nbsp; {isOpen ? "▲" : "▼"}</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
            className="overflow-hidden bg-black/30"
          >
            <div className="p-4 space-y-2 font-mono text-[9.5px] text-white/80 leading-relaxed border-t border-white/5">
              {steps.map((step, idx) => (
                <div key={idx} className="flex gap-2 items-start">
                  <span className="text-purple-400 font-bold">[{idx + 1}]</span>
                  <span className="break-all">{step}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- UPGRADE: MOBILE-COMPATIBLE ECOSYSTEM SOCIALS CAROUSEL ---
function SocialMatrixCarousel() {
  const socials = [
    { name: "𝕏", url: "https://x.com/MantleCore_", text: "@MantleCore_", color: "text-white" },
    { name: "✈️", url: "https://t.me/MantleAgentic", text: "t.me/MantleAgentic", color: "text-blue-400" },
    { name: "💬", url: "https://discord.gg/RZDdfKvWYC", text: "discord.gg/MantleCore", color: "text-indigo-400" },
    { name: "✉️", url: "mailto:mantlecore.agent@gmail.com", text: "mantlecore.agent@gmail.com", color: "text-red-400" },
    { name: "🐙", url: "https://github.com/NomadDigita/mantle-agentic-core", text: "github/MantleAgentic", color: "text-white/90" }
  ];

  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % socials.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [socials.length]);

  const active = socials[index];

  return (
    <a 
      href={active.url} target="_blank" rel="noopener noreferrer"
      className="flex items-center gap-2 bg-white/10 border border-white/10 px-3 py-1.5 rounded-full hover:bg-white/20 hover:border-purple-500/50 transition-all shadow-md overflow-hidden relative max-w-[150px] sm:max-w-[200px] mobile-touch-target"
    >
      <span className="text-xs flex-shrink-0">{active.name}</span>
      <AnimatePresence mode="wait">
        <motion.span
          key={active.text}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          className={`text-[8px] sm:text-[9px] font-mono font-bold truncate ${active.color}`}
        >
          {active.text}
        </motion.span>
      </AnimatePresence>
    </a>
  );
}

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [showIntro, setShowIntro] = useState(false); 
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevMessagesLength = useRef(0);

  const { isOverclocked, toggleOverclock, safeColors, setSystemState } = useTheme();
  const { primary, secondary, border, dotBg } = safeColors;

  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();

  const [command, setCommand] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", role: "system", text: "Neural link established. Awaiting input." }
  ]);

  // LIVE PORTFOLIO STATE
  const [activePositions, setActivePositions] = useState<ActivePosition[]>([]);

  // ON-CHAIN GOVERNANCE PROFILE STATE
  const [agentProfile, setAgentProfile] = useState<AgentOnChainProfile | null>(null);
  const [isCheckingAgent, setIsCheckingAgent] = useState(false);

  // ON-CHAIN MAC TRADE ESCROW SYSTEM
  const [pendingTradePayload, setPendingTradePayload] = useState<{ msgId: string, payload: ActionPayload } | null>(null);
  
  const { writeContract, data: txHash } = useWriteContract();
  
  // --- UPGRADE: GATED TRANSACTION MONITORS ---
  const { isLoading: isTradeConfirming, isSuccess: isTradeSuccess } = useWaitForTransactionReceipt({ 
    hash: txHash,
    query: { enabled: !!txHash }
  });

  // STATE-LOCKED RENDER STABILITY ENGINE
  const [isRestored, setIsRestored] = useState(false);

  // AI YIELD WEAVER HUD MODULE STATE
  const [yieldWeaverMode, setYieldWeaverMode] = useState<"IDLE" | "WEAVING" | "mETH_PREMIUM">("IDLE");
  const { writeContract: weaveWrite, data: weaveHash } = useWriteContract();
  const { isLoading: isWeavingTx, isSuccess: isWeaveConfirmed } = useWaitForTransactionReceipt({ 
    hash: weaveHash,
    query: { enabled: !!weaveHash }
  });

  // SECOPS SENTINEL SHIELD STATES
  const [secOpsActive, setSecOpsActive] = useState(false);
  const [exploitAlert, setExploitAlert] = useState(false);
  const { writeContract: rescueWrite, data: rescueHash } = useWriteContract();
  const { isLoading: isSecuringRescue, isSuccess: isRescueSuccess } = useWaitForTransactionReceipt({ 
    hash: rescueHash,
    query: { enabled: !!rescueHash }
  });

  // --- UPGRADE: 3-WAY MATRIX CHIP SELECTOR STATE ---
  const [designMode, setDesignMode] = useState<"AURA" | "SILENT" | "CHROME">("AURA");
  const [isAuraActive, setIsAuraActive] = useState(true);

  // Sync state helpers with dynamic toggle selectors
  useEffect(() => {
    setIsAuraActive(designMode === "AURA");
  }, [designMode]);

  const handleToggleDesignMode = (e: React.MouseEvent) => {
    e.preventDefault();
    setDesignMode(prev => {
      if (prev === "AURA") return "CHROME";
      if (prev === "CHROME") return "SILENT";
      return "AURA";
    });
  };

  const handleToggleOverclockClick = (e: React.MouseEvent) => {
    e.preventDefault();
    toggleOverclock();
  };

  // ORGANIC MULTI-AGENT COLLABORATIVEseq Sequencer
  const [relayLogs, setRelayLogs] = useState<RelayPingLog[]>([
    { id: "init-1", agent: "Yield Scribe", color: "text-emerald-400", text: "Matrix initialised. Scanning Ondo APY metrics..." },
    { id: "init-2", agent: "Sentinel Hub", color: "text-purple-400", text: "Mempool scanner listening at block 543210..." },
    { id: "init-3", agent: "Alpha Trace", color: "text-amber-500", text: "Tracking multi-sig smart wallets on Mantle Sepolia..." }
  ]);

  // --- NATIVE MNT GAS MONITORING ---
  const { data: balanceData, refetch: refetchBalance } = useBalance({
    address: address as `0x${string}`,
    chainId: 5003
  });
  const mntGasBalance = balanceData ? parseFloat((balanceData as any).formatted) : 5.0; 
  const [isRefueling, setIsRefueling] = useState(false);
  const [refuelResultHash, setRefuelResultHash] = useState<string | null>(null);

  // Wagmi signature for the refuel MAC feepayment (5 MAC collateral)
  const { writeContract: refuelFeeWrite, data: refuelFeeHash } = useWriteContract();
  const { isLoading: isRefuelFeePending, isSuccess: isRefuelFeeSuccess } = useWaitForTransactionReceipt({ 
    hash: refuelFeeHash,
    query: { enabled: !!refuelFeeHash }
  });

  useEffect(() => { 
    setMounted(true); 
    if (sessionStorage.getItem("systemInitialized") !== "true") setShowIntro(true);
  }, []);

  const handleIntroComplete = () => {
    sessionStorage.setItem("systemInitialized", "true");
    setShowIntro(false);
  };

  const [headerText, setHeaderText] = useState("> SCANNING MANTLE MEMPOOL...");
  useEffect(() => {
    const lines = [
      "> SCANNING MANTLE MEMPOOL...", 
      "> ANALYZING L2 LIQUIDITY...", 
      "> ERC-8004 PROTOCOLS ACTIVE...", 
      "> WAITING FOR EXECUTIVE COMMAND..."
    ];
    let i = 0;
    const interval = setInterval(() => { i = (i + 1) % lines.length; setHeaderText(lines[i]); }, 4500);
    return () => clearInterval(interval);
  }, []);

  const marketCoins = [
    { symbol: 'BTC', pair: 'BTCUSDT', name: 'BITCOIN', color: 'text-emerald-400', glow: 'shadow-[0_0_15px_rgba(16,185,129,0.3)]', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10' },
    { symbol: 'ETH', pair: 'ETHUSDT', name: 'ETHEREUM', color: 'text-blue-400', glow: 'shadow-[0_0_15px_rgba(59,130,246,0.3)]', border: 'border-blue-500/30', bg: 'bg-blue-500/10' },
    { symbol: 'SOL', pair: 'SOLUSDT', name: 'SOLANA', color: 'text-amber-500', glow: 'shadow-[0_0_15px_rgba(245,158,11,0.3)]', border: 'border-amber-500/30', bg: 'bg-amber-500/10' }
  ];
  const [activeCoinIndex, setActiveCoinIndex] = useState(0);
  
  // --- REALISTIC DUMMY VOLATILITY ENGINE ---
  const basePrices = useRef<Record<string, number>>({'BTCUSDT': 84420.50, 'ETHUSDT': 4704.12, 'SOLUSDT': 142.85});
  const [rawPrices, setRawPrices] = useState<Record<string, number>>({'BTCUSDT': 84420.50, 'ETHUSDT': 4704.12, 'SOLUSDT': 142.85});
  const [livePrices, setLivePrices] = useState({'BTCUSDT': '$84,420.50', 'ETHUSDT': '$4,704.12', 'SOLUSDT': '$142.85'});

  useEffect(() => {
    const simulateLivePrices = () => {
      const newRawPrices: Record<string, number> = {};
      const newLivePrices: any = {};
      
      Object.keys(basePrices.current).forEach(pair => {
        const base = basePrices.current[pair];
        const volatility = base * (Math.random() * 0.002 - 0.001);
        const newPrice = base + volatility;
        
        basePrices.current[pair] = newPrice;
        newRawPrices[pair] = newPrice;
        newLivePrices[pair] = newPrice.toLocaleString('en-US', { style: 'currency', currency: 'USD' }); 
      });
      
      setRawPrices(newRawPrices);
      setLivePrices(newLivePrices);

      setActivePositions(prev => prev.map(pos => {
        const currentLivePrice = newRawPrices[pos.pair];
        if (!currentLivePrice) return pos;

        const priceDiff = currentLivePrice - pos.entryPrice;
        const percentageMove = (priceDiff / pos.entryPrice) * 100;
        const pnlMultiplier = pos.type === 'SHORT' ? -1 : 1;
        const actualPnlPercentage = percentageMove * pos.leverage * pnlMultiplier;
        
        const actualPnlDollars = (1000 * (actualPnlPercentage / 100));

        return {
          ...pos,
          currentPrice: currentLivePrice,
          pnl: actualPnlDollars,
          pnlPercentage: actualPnlPercentage
        };
      }));
    };
    
    const priceInterval = setInterval(simulateLivePrices, 3000); 
    const coinInterval = setInterval(() => { setActiveCoinIndex(prev => (prev + 1) % marketCoins.length); }, 6000); 
    
    return () => { clearInterval(priceInterval); clearInterval(coinInterval); };
  }, []);

  // --- MATRIX RELAY PROCEDURAL SEQUENCER ENGINE ---
  useEffect(() => {
    const relayTemplates: { agent: "Yield Scribe" | "Sentinel Hub" | "Alpha Trace", color: string, text: string[] }[] = [
      {
        agent: "Yield Scribe",
        color: "text-emerald-400",
        text: [
          "Ondo USDY vault rebalancings calculated. Yield premium: +1.2%",
          "Mantle Staking mETH pool index matches expectations. APY target: 7.21%",
          "Escrow contract fee successfully locked into L2 staking vaults."
        ]
      },
      {
        agent: "Sentinel Hub",
        color: "text-purple-400",
        text: [
          "Mempool sequence verified. No abnormal reentrancy patterns logged.",
          "Mantle Registry state verified. On-chain ownership checksum passed.",
          "Sentinel monitoring secured at block height: 543292."
        ]
      },
      {
        agent: "Alpha Trace",
        color: "text-amber-500",
        text: [
          "Mantle whale wallet movements indexed. Net inflows: +2.4M MNT",
          "Mempool gas price stable. Target gas execution is 0.05 MNT.",
          "Pre-cognitive sentiment metrics signaling buy pressure."
        ]
      }
    ];

    const generateRelayPing = () => {
      const selectedTemplate = relayTemplates[Math.floor(Math.random() * relayTemplates.length)];
      const text = selectedTemplate.text[Math.floor(Math.random() * selectedTemplate.text.length)];
      const uniqueId = `${selectedTemplate.agent}-${Date.now()}-${Math.random()}`; // Fix duplicate key exception
      
      setRelayLogs(prev => {
        const nextLogs = [{ id: uniqueId, agent: selectedTemplate.agent, color: selectedTemplate.color, text }, ...prev];
        return nextLogs.slice(0, 8); 
      });
    };

    const interval = setInterval(generateRelayPing, 3500);
    return () => clearInterval(interval);
  }, []);

  // --- STATE-LOCKED CACHE RESTORATION ---
  useEffect(() => {
    if (isConnected && address) {
      setIsRestored(false); 
      const cachedMessages = localStorage.getItem(`mac_messages_${address.toLowerCase()}`);
      const cachedPositions = localStorage.getItem(`mac_positions_${address.toLowerCase()}`);
      
      if (cachedMessages) setMessages(JSON.parse(cachedMessages));
      else setMessages([{ id: "1", role: "system", text: "Neural link established. Awaiting input." }]);
      
      if (cachedPositions) setActivePositions(JSON.parse(cachedPositions));
      else setActivePositions([]);
      
      setIsRestored(true); 
    }
  }, [isConnected, address]);

  // --- WRITE MONITORS CACHED ---
  useEffect(() => {
    if (isConnected && address && isRestored && messages.length > 1) {
      localStorage.setItem(`mac_messages_${address.toLowerCase()}`, JSON.stringify(messages));
    }
  }, [messages, isConnected, address, isRestored]);

  useEffect(() => {
    if (isConnected && address && isRestored) {
      localStorage.setItem(`mac_positions_${address.toLowerCase()}`, JSON.stringify(activePositions));
    }
  }, [activePositions, isConnected, address, isRestored]);


  // --- IDENTITY SCANNER FIXED & ESCAPED ---
  useEffect(() => {
    if (!isConnected || !address) {
      setAgentProfile(null);
      return;
    }

    const scanOnChainAgent = async () => {
      setIsCheckingAgent(true);
      try {
        const client = createPublicClient({
          chain: {
            id: 5003,
            name: "Mantle Sepolia",
            nativeCurrency: { name: "MNT", symbol: "MNT", decimals: 18 },
            rpcUrls: { default: { http: ["https://rpc.sepolia.mantle.xyz"] } }
          },
          transport: http()
        });

        const balance = await (client as any).readContract({
          address: "0x1E5B64264089aacC547A1506402B94f909215942",
          abi: [
            {
              inputs: [{ internalType: "address", name: "owner", type: "address" }],
              name: "balanceOf",
              outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
              stateMutability: "view",
              type: "function"
            }
          ],
          functionName: "balanceOf",
          args: [address as `0x${string}`]
        }) as bigint;

        if (balance > BigInt(0)) {
          const cachedProfile = localStorage.getItem(`mac_agent_${address.toLowerCase()}`);
          if (cachedProfile) {
            setAgentProfile(JSON.parse(cachedProfile));
            setIsCheckingAgent(false);
            return;
          }

          try {
            const logs = await client.getLogs({
              address: "0x1E5B64264089aacC547A1506402B94f909215942",
              event: parseAbiItem("event AgentAwakened(address indexed creator, uint256 indexed agentId, string riskStrategy)"),
              args: { creator: address as `0x${string}` },
              fromBlock: "earliest",
              toBlock: "latest"
            });

            if (logs.length > 0) {
              const latestLog = logs[logs.length - 1] as any;
              const activeAgentId = latestLog.args.agentId;

              if (activeAgentId) {
                const rawProfile = await (client as any).readContract({
                  address: "0x1E5B64264089aacC547A1506402B94f909215942",
                  abi: ERC8004_IDENTITY_ABI, 
                  functionName: "getAgentProfile",
                  args: [activeAgentId]
                }) as readonly [string, bigint, bigint, boolean];

                const fetchedProfile = {
                  riskStrategy: rawProfile[0],
                  maxDrawdown: Number(rawProfile[1]),
                  birthTimestamp: Number(rawProfile[2]),
                  isAutonomous: rawProfile[3]
                };

                setAgentProfile(fetchedProfile);
                localStorage.setItem(`mac_agent_${address.toLowerCase()}`, JSON.stringify(fetchedProfile));
                return;
              }
            }
          } catch (logError) {
            console.warn("eth_getLogs indexers offline. Launching fallback sequential search...");
            
            for (let i = 1; i <= 50; i++) {
              try {
                const owner = await (client as any).readContract({
                  address: "0x1E5B64264089aacC547A1506402B94f909215942",
                  abi: [
                    {
                      inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
                      name: "ownerOf",
                      outputs: [{ internalType: "address", name: "", type: "address" }],
                      stateMutability: "view",
                      type: "function"
                    }
                  ],
                  functionName: "ownerOf",
                  args: [BigInt(i)]
                }) as `0x${string}`;

                if (owner.toLowerCase() === address.toLowerCase()) {
                  const rawProfile = await (client as any).readContract({
                    address: "0x1E5B64264089aacC547A1506402B94f909215942",
                    abi: ERC8004_IDENTITY_ABI, 
                    functionName: "getAgentProfile",
                    args: [BigInt(i)]
                  }) as readonly [string, bigint, bigint, boolean];

                  const fetchedProfile = {
                    riskStrategy: rawProfile[0],
                    maxDrawdown: Number(rawProfile[1]),
                    birthTimestamp: Number(rawProfile[2]),
                    isAutonomous: rawProfile[3]
                  };

                  setAgentProfile(fetchedProfile);
                  localStorage.setItem(`mac_agent_${address.toLowerCase()}`, JSON.stringify(fetchedProfile));
                  break;
                }
              } catch (ownerErr) {
                break;
              }
            }
          }
        } else {
          setAgentProfile(null);
        }
      } catch (err) {
        console.error("On-chain Agent lookup failed:", err);
      } finally {
        setIsCheckingAgent(false);
      }
    };

    scanOnChainAgent();
  }, [isConnected, address]);

  // --- SMART SCROLL EFFECT ---
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 120;
    const hasNewMessage = messages.length > prevMessagesLength.current;

    if (hasNewMessage || isNearBottom) {
      container.scrollTop = container.scrollHeight;
    }

    prevMessagesLength.current = messages.length;
  }, [messages, activePositions]);

  const handleSignExecution = async (msgId: string, payload: ActionPayload) => {
    if (agentProfile) {
      const strategy = agentProfile.riskStrategy.toLowerCase();
      if (strategy.includes("conservative") && payload.leverage > 5) {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: "error",
          text: `🚨 SIGNING REJECTED BY ON-CHAIN GOVERNANCE:\nYour active ERC-8004 Agent Strategy is Conservative. Maximum allowable leverage is 5x (Attempted: ${payload.leverage}x).`
        }]);
        return;
      }
      if (strategy.includes("balanced") && payload.leverage > 10) {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: "error",
          text: `🚨 SIGNING REJECTED BY ON-CHAIN GOVERNANCE:\nYour active ERC-8004 Agent Strategy is Balanced. Maximum allowable leverage is 10x (Attempted: ${payload.leverage}x).`
        }]);
        return;
      }
    }

    setSystemState('MINTING'); 
    setPendingTradePayload({ msgId, payload });

    try {
      writeContract({
        address: '0x69465a67c1C4860f89f2D80fab5dADF33495d171', 
        abi: [{
          inputs: [
            { internalType: "address", name: "recipient", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "transfer",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        }],
        functionName: 'transfer',
        args: [
          '0x1E5B64264089aacC547A1506402B94f909215942', 
          BigInt(5 * 10**18) 
        ]
      });
    } catch (err) {
      console.error("Trade signature authorization failed", err);
      setPendingTradePayload(null);
      if (!isOverclocked) setSystemState('IDLE');
    }
  };

  useEffect(() => {
    if (isTradeSuccess && pendingTradePayload) {
      const { msgId, payload } = pendingTradePayload;

      setMessages(prev => prev.map(msg => {
        if (msg.id === msgId && msg.actionPayload) {
          return { ...msg, actionPayload: { ...msg.actionPayload, status: 'SUCCESS' } };
        }
        return msg;
      }));

      const newPosition: ActivePosition = {
        id: msgId,
        asset: payload.asset,
        pair: payload.pair,
        type: payload.type,
        leverage: payload.leverage,
        entryPrice: rawPrices[payload.pair] || 0,
        currentPrice: rawPrices[payload.pair] || 0,
        pnl: 0,
        pnlPercentage: 0
      };

      if (newPosition.type !== 'SWAP') {
        setActivePositions(prev => [newPosition, ...prev]);
      }

      setPendingTradePayload(null);
      if (!isOverclocked) setSystemState('IDLE');
    }
  }, [isTradeSuccess, rawPrices]);

  const handleExecute = async () => {
    if (!command.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", text: command };
    setMessages(prev => [...prev, userMsg]);
    setIsExecuting(true);
    
    if (!isOverclocked) setSystemState('ANALYZING');

    const lowerCmd = command.toLowerCase();
    
    // --- REGEX LEVERAGE DETECTOR ---
    const leverageMatch = lowerCmd.match(/(\d+)x/);
    const parsedLeverage = leverageMatch ? parseInt(leverageMatch[1]) : 10;

    let pendingAction: ActionPayload | undefined = undefined;
    
    if (lowerCmd.includes("simulate") || lowerCmd.includes("attack")) {
       setSecOpsActive(true);
       setExploitAlert(true);
       toggleOverclock(); 
    }

    if (lowerCmd.includes("weave") || lowerCmd.includes("yield")) {
       setYieldWeaverMode("WEAVING");
    }

    if (lowerCmd.includes("short btc")) pendingAction = { asset: "BTC", pair: "BTCUSDT", type: "SHORT", leverage: parsedLeverage, status: "PENDING", confidence: 78, risk: "HIGH", analysis: "Heavy resistance detected at $85k zone. Institutional distribution likely." };
    else if (lowerCmd.includes("long btc")) pendingAction = { asset: "BTC", pair: "BTCUSDT", type: "LONG", leverage: parsedLeverage, status: "PENDING", confidence: 62, risk: "MEDIUM", analysis: "Moving averages crossing bullish, but volume remains constrained on L2." };
    else if (lowerCmd.includes("short eth")) pendingAction = { asset: "ETH", pair: "ETHUSDT", type: "SHORT", leverage: parsedLeverage, status: "PENDING", confidence: 45, risk: "HIGH", analysis: "Counter-trend execution. Smart money is currently accumulating spot ETH." };
    else if (lowerCmd.includes("long eth")) pendingAction = { asset: "ETH", pair: "ETHUSDT", type: "LONG", leverage: parsedLeverage, status: "PENDING", confidence: 88, risk: "LOW", analysis: "Golden cross confirmed. Ecosystem liquidity flowing heavily into LSTs." };
    else if (lowerCmd.includes("swap") || lowerCmd.includes("buy")) pendingAction = { asset: "MNT", pair: "BTCUSDT", type: "SWAP", leverage: 1, status: "PENDING", confidence: 99, risk: "LOW", analysis: "Optimal routing path found via Agni Finance. Slippage < 0.1%." };

    if (pendingAction && agentProfile) {
      const strategy = agentProfile.riskStrategy.toLowerCase();
      if (strategy.includes("conservative") && pendingAction.leverage > 5) {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: "error",
          text: `🛑 AGENT INTERCEPT ERROR:\nCommand execution blocked. Active on-chain identity is locked into Conservative parameters. High leverage trades (>5x) are disabled.`
        }]);
        setIsExecuting(false);
        setCommand("");
        if (!isOverclocked) setSystemState('IDLE');
        return;
      }
      
      // --- ENFORCE BALANCED PROFILE CONSTRAINT INTERCEPT ---
      if (strategy.includes("balanced") && pendingAction.leverage > 10) {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: "error",
          text: `🛑 AGENT INTERCEPT ERROR:\nCommand execution blocked. Active on-chain identity is locked into Balanced parameters. High leverage trades (>10x) are disabled.`
        }]);
        setIsExecuting(false);
        setCommand("");
        if (!isOverclocked) setSystemState('IDLE');
        return;
      }
    }

    let finalPayload = command;
    if (isOverclocked) finalPayload += "\n\n<SYSTEM_DIRECTIVE>CRITICAL: OVERCLOCK mode. Act like a hyper-aggressive Web3 degen. Use ALL CAPS. Include system parsing logs in your output.</SYSTEM_DIRECTIVE>";
    else finalPayload += "\n\n<SYSTEM_DIRECTIVE>Maintain system formatting. Include diagnostic headers and system directive tags in your analysis to demonstrate agentic processing.</SYSTEM_DIRECTIVE>";

    try {
      const response = await fetch("https://mantle-agentic-core.onrender.com/api/execute", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: finalPayload, wallet_address: address || null })
      });
      const data = await response.json();
      
      let sanitizedMessage = data.message.replace(/@asiwajubtc/gi, "Mantle SecOps").replace(/ASIWAJU TERMINAL/gi, "MANTLE AGENTIC CORE").replace(/Asiwaju/gi, "Mantle Agent");
      
      // --- UPGRADE: OPTION C REASONING HASH ---
      const generatedHash = "0x" + Array.from(new TextEncoder().encode(data.message || ""))
        .map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 64);

      setMessages(prev => [...prev, { 
        id: (Date.now() + 1).toString(), 
        role: data.status === "success" ? "ai" : "error", 
        text: sanitizedMessage,
        actionPayload: pendingAction,
        thinkingSteps: data.thinking_steps || [],
        latency: data.latency || "" ,
        decisionHash: generatedHash
      }]);
    } catch (error) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: "error", text: "CONNECTION FAILURE: Brain Engine unreachable." }]);
    } finally {
      setIsExecuting(false); 
      setCommand("");
      if (!isOverclocked) setSystemState('IDLE');
    }
  };

  const handleWeaveYield = async () => {
    setSystemState('MINTING');
    try {
      weaveWrite({
        address: '0x69465a67c1C4860f89f2D80fab5dADF33495d171', 
        abi: [{
          inputs: [
            { internalType: "address", name: "recipient", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "transfer",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        }],
        functionName: 'transfer',
        args: [
          '0x1E5B64264089aacC547A1506402B94f909215942', 
          BigInt(5 * 10**18) 
        ]
      });
    } catch (err) {
      console.error("Weave deployment tx aborted:", err);
      if (!isOverclocked) setSystemState('IDLE');
    }
  };

  useEffect(() => {
    if (isWeaveConfirmed) {
      setYieldWeaverMode("mETH_PREMIUM");
      if (!isOverclocked) setSystemState('IDLE');
    }
  }, [isWeaveConfirmed, isOverclocked, setSystemState]);

  const handleRescueSecOps = async () => {
    setSystemState('MINTING');
    try {
      rescueWrite({
        address: '0x69465a67c1C4860f89f2D80fab5dADF33495d171', 
        abi: [{
          inputs: [
            { internalType: "address", name: "recipient", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "transfer",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        }],
        functionName: 'transfer',
        args: [
          '0x1E5B64264089aacC547A1506402B94f909215942',
          BigInt(5 * 10**18)
        ]
      });
    } catch (err) {
      console.error("Rescue signature aborted:", err);
      if (!isOverclocked) setSystemState('IDLE');
    }
  };

  useEffect(() => {
    if (isRescueSuccess) {
      setExploitAlert(false);
      toggleOverclock(); 
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: "system",
        text: `🛡️ SECOPS Sentinel: Exploit front-run successful. Deployed contract state paused.\nRegistry Safe Vault successfully locked with hash: ${rescueHash}.`
      }]);
    }
  }, [isRescueSuccess]);

  // REQUEST AUTONOMOUS MNT GAS REFUEL
  const handleRequestRefuel = async () => {
    if (!address) return;
    setIsRefueling(true);
    setSystemState('MINTING');
    
    try {
      refuelFeeWrite({
        address: '0x69465a67c1C4860f89f2D80fab5dADF33495d171',
        abi: [{
          inputs: [
            { internalType: "address", name: "recipient", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" }
          ],
          name: "transfer",
          outputs: [{ internalType: "bool", name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        }],
        functionName: 'transfer',
        args: [
          '0x1E5B64264089aacC547A1506402B94f909215942',
          BigInt(5 * 10**18) 
        ]
      });
    } catch (err) {
      console.error("Refuel fee authorization failed:", err);
      setIsRefueling(false);
      if (!isOverclocked) setSystemState('IDLE');
    }
  };

  useEffect(() => {
    if (isRefuelFeeSuccess && address) {
      const dispatchBackendRefuel = async () => {
        try {
          const response = await fetch("https://mantle-agentic-core.onrender.com/api/refuel", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ wallet_address: address })
          });
          const data = await response.json();
          
          if (data.status === "success") {
            setRefuelResultHash(data.message);
            setTimeout(() => {
              refetchBalance();
            }, 3000);
          }
        } catch (err) {
          console.error("Backend refuel pipeline crashed:", err);
        } finally {
          setIsRefueling(false);
          if (!isOverclocked) setSystemState('IDLE');
        }
      };

      dispatchBackendRefuel();
    }
  }, [isRefuelFeeSuccess, address, refetchBalance]);

  if (!mounted) return null;
  const currentMarket = marketCoins[activeCoinIndex];

  return (
    // --- UPGRADE: MOBILE-OPTIMIZED LIQUID CONTAINER (z-10 stacking context) ---
    <main className={`min-h-screen relative p-2 sm:p-6 lg:p-12 z-10 overflow-x-hidden bg-transparent font-sans transition-all duration-1000 ${
      isOverclocked 
        ? 'shadow-[inset_0_0_120px_rgba(239,68,68,0.18)] bg-red-950/5' 
        : ''
    }`}>
      <AnimatePresence>
        {showIntro && <IntroSequence designMode={designMode} onComplete={handleIntroComplete} />}
      </AnimatePresence>

      {/* DEEP LIQUID NODE PARTICLE BACKGROUND */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-20 opacity-30">
        <div className="absolute top-[10%] left-[20%] w-[45vw] h-[45vw] bg-emerald-500/5 rounded-full blur-[140px] animate-[pulse_10s_ease-in-out_infinite]" />
        <div className="absolute bottom-[10%] right-[10%] w-[55vw] h-[55vw] bg-blue-500/5 rounded-full blur-[160px] animate-[pulse_12s_ease-in-out_infinite_delay-2s]" />
        
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#000_100%)]" />
        
        <div className="absolute top-[20%] left-[30%] w-2 h-2 rounded-full bg-emerald-400 opacity-20 animate-ping [animation-duration:5s]" />
        <div className="absolute top-[65%] left-[15%] w-1.5 h-1.5 rounded-full bg-blue-400 opacity-20 animate-ping [animation-duration:7s]" />
        <div className="absolute top-[45%] left-[80%] w-2 h-2 rounded-full bg-purple-400 opacity-20 animate-ping [animation-duration:6s]" />

        <svg className="absolute bottom-0 left-0 w-full h-[35vh] opacity-10" viewBox="0 0 1440 320" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fill="url(#water-grad)" d="M0,96L48,112C96,128,192,160,288,186.7C384,213,480,235,576,218.7C672,203,768,149,864,138.7C960,128,1056,160,1152,165.3C1248,171,1344,149,1392,138.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" />
          <defs>
            <linearGradient id="water-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* --- UPGRADE: FULL SCREEN CHRONIC OVERCLOCK AMBIENT RADIAL LIGHT --- */}
      {isOverclocked && (
        <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.12)_0%,rgba(0,0,0,0.85)_100%)] pointer-events-none -z-15 transition-all duration-1000 animate-pulse" />
      )}

      <motion.div 
        initial={{ opacity: 0, filter: "blur(20px)" }} animate={{ opacity: showIntro ? 0 : 1, filter: showIntro ? "blur(20px)" : "blur(0px)" }} transition={{ duration: 1 }}
        className="max-w-7xl mx-auto space-y-6 mt-2 relative z-10"
      >
        
        {/* ========================================================= */}
        {/* --- UPGRADE: PREMIUM STARFIELD CONTACTS & SOCIALS BLOCK --- */}
        {/* ========================================================= */}
        <div className="relative rounded-3xl p-[1px] overflow-hidden transition-all duration-700 w-full">
          {/* Dynamic glowing border depending on Overclock status */}
          <div className={`absolute inset-0 bg-gradient-to-r ${isOverclocked ? 'from-red-500/30 via-red-950/20 to-red-600/30' : 'from-emerald-500/25 via-purple-500/15 to-blue-500/25'} blur-sm pointer-events-none`} />
          
          <div className="relative rounded-[23px] bg-[rgba(6,9,20,0.45)] backdrop-blur-[55px] p-5 border border-white/15 flex flex-col md:flex-row justify-between items-center gap-4 overflow-hidden shadow-2xl">
            {/* Absolute Twinkling Mini-Stars (Pure CSS keyframes powered) */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
              <div className="star-yellow absolute top-[20%] left-[8%] w-1.5 h-1.5 bg-amber-400 rounded-full" />
              <div className="star-white absolute top-[70%] left-[15%] w-1 h-1 bg-white rounded-full" />
              <div className="star-blue absolute top-[30%] left-[45%] w-1.5 h-1.5 bg-blue-400 rounded-full" />
              <div className="star-purple absolute top-[80%] left-[55%] w-1 h-1 bg-purple-400 rounded-full" />
              <div className="star-green absolute top-[40%] left-[75%] w-1.5 h-1.5 bg-emerald-400 rounded-full" />
              <div className="star-white absolute top-[25%] left-[90%] w-1 h-1 bg-white rounded-full" />
              <div className="star-yellow absolute top-[75%] left-[85%] w-1 h-1 bg-amber-300 rounded-full" />
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left z-10 relative">
              <div className={`px-4 py-1.5 rounded-full border text-[9px] font-mono tracking-[0.2em] uppercase font-black ${isOverclocked ? 'from-red-500/10 to-red-700/10 border-red-500/40 text-red-400' : 'from-emerald-500/10 to-blue-500/10 border-emerald-500/30 text-emerald-300'}`}>
                OFFICIAL PORTALS
              </div>
              <p className="text-[10px] sm:text-xs font-mono text-sharp-secondary font-medium">Secure verification lines synced with the principal ledger.</p>
            </div>

            {/* Custom SVG social matrix buttons, optimized with brands color indicators */}
            <div className="flex flex-wrap justify-center items-center gap-3 z-10 relative">
              {/* X (Formerly Twitter) Logo */}
              <a 
                href="https://x.com/MantleCore_" target="_blank" rel="noopener noreferrer"
                className="p-3 rounded-xl bg-black/40 border border-white/10 hover:border-white/40 hover:bg-black transition-all flex items-center justify-center group mobile-touch-target"
                title="Follow Official X"
              >
                <svg className="w-4 h-4 text-white group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>

              {/* Telegram Logo */}
              <a 
                href="https://t.me/MantleAgentic" target="_blank" rel="noopener noreferrer"
                className="p-3 rounded-xl bg-black/40 border border-white/10 hover:border-blue-400/40 hover:bg-blue-950/20 transition-all flex items-center justify-center group mobile-touch-target"
                title="Join Telegram Channel"
              >
                <svg className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.37.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .24z"/>
                </svg>
              </a>

              {/* Discord Logo */}
              <a 
                href="https://discord.gg/RZDdfKvWYC" target="_blank" rel="noopener noreferrer"
                className="p-3 rounded-xl bg-black/40 border border-white/10 hover:border-indigo-400/40 hover:bg-indigo-950/20 transition-all flex items-center justify-center group mobile-touch-target"
                title="Enter Discord Sanctuary"
              >
                <svg className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.27 4.73a16.13 16.13 0 0 0-3.97-1.23.1.1 0 0 0-.1.05c-.35.62-.74 1.44-1.01 2.1a15 15 0 0 0-4.38 0c-.27-.66-.67-1.48-1.02-2.1a.1.1 0 0 0-.1-.05 16.13 16.13 0 0 0-3.97 1.23.1.1 0 0 0-.05.04C1.9 9.36 1.02 13.84 1.48 18.25a.1.1 0 0 0 .04.07 16.27 16.27 0 0 0 4.9 2.48.1.1 0 0 0 .11-.04c.38-.51.72-1.07 1-1.66a.1.1 0 0 0-.06-.13 10.74 10.74 0 0 1-1.51-.72.1.1 0 0 1-.01-.16c.1-.08.2-.15.3-.23a.1.1 0 0 1 .11-.01c3.15 1.44 6.57 1.44 9.66 0a.1.1 0 0 1 .11.01c.1.08.2.15.3.23a.1.1 0 0 1-.01.16 10.5 10.5 0 0 1-1.51.72.1.1 0 0 0-.06.13c.29.59.63 1.15 1 1.66a.1.1 0 0 0 .11.04 16.27 16.27 0 0 0 4.9-2.48.1.1 0 0 0 .04-.07c.56-5.1-.9-9.54-3.57-13.48a.1.1 0 0 0-.05-.04zM8.52 14.85c-.95 0-1.72-.87-1.72-1.94s.75-1.94 1.72-1.94c.98 0 1.73.88 1.72 1.94 0 1.07-.75 1.94-1.72 1.94zm6.96 0c-.95 0-1.72-.87-1.72-1.94s.75-1.94 1.72-1.94c.98 0 1.73.88 1.72 1.94 0 1.07-.75 1.94-1.72 1.94z"/>
                </svg>
              </a>

              {/* Gmail Envelope */}
              <a 
                href="mailto:mantlecore.agent@gmail.com"
                className="p-3 rounded-xl bg-black/40 border border-white/10 hover:border-red-400/40 hover:bg-red-950/20 transition-all flex items-center justify-center group mobile-touch-target"
                title="Direct Operator Line"
              >
                <svg className="w-4 h-4 text-red-400 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </a>

              {/* GitHub Octocat */}
              <a 
                href="https://github.com/NomadDigita/mantle-agentic-core" target="_blank" rel="noopener noreferrer"
                className="p-3 rounded-xl bg-black/40 border border-white/30 hover:border-white/5 transition-all flex items-center justify-center group mobile-touch-target"
                title="Examine Public Sources"
              >
                <svg className="w-4 h-4 text-white/80 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* --- UPGRADE: RESPONSIVE HEADER DECK --- */}
        <div className={`flex flex-col sm:flex-row justify-between items-center gap-4 bg-white/5 backdrop-blur-xl border ${border} p-4 sm:p-6 rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-all duration-500`}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-black/40 border border-white/10 shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]">
              <div className={`w-4 h-4 rounded-full ${isOverclocked ? 'bg-red-500 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.8)]' : dotBg}`} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-widest text-white uppercase drop-shadow-md">
                MANTLE <span className={primary}>CORE</span>
              </h1>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 sm:gap-4 justify-center">
             {/* AURA MODE SELECTOR BUTTON */}
             <button 
              onClick={handleToggleDesignMode}
              className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all duration-500 border backdrop-blur-md shadow-lg mobile-touch-target relative z-50 ${
                designMode === "AURA" 
                  ? 'bg-purple-500/20 text-purple-400 border-purple-500/50 hover:bg-purple-500/30' 
                  : designMode === "CHROME"
                  ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50 hover:bg-indigo-500/30'
                  : 'bg-black/20 text-white/50 border-white/10 hover:border-white/35 hover:text-white'
              }`}
            >
              {designMode === "AURA" ? 'AURA MATRIX: ON' : designMode === "CHROME" ? 'CHROME 4D: ON' : 'SILENT GLASS: ON'}
            </button>
             <button 
              onClick={handleToggleOverclockClick}
              className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all duration-500 border backdrop-blur-md shadow-lg mobile-touch-target relative z-50 ${
                isOverclocked 
                  ? 'bg-red-500/30 text-red-400 border-red-500/60 hover:bg-red-500/40' 
                  : 'bg-black/20 text-white/50 border-white/10 hover:border-emerald-500/50 hover:text-emerald-400'
              }`}
            >
              {isOverclocked ? 'BEAST ONLINE' : 'OVERCLOCK'}
            </button>
            <Link href="/citadel"><button className="px-4 sm:px-6 py-2 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest text-white/80 bg-black/20 border border-white/10 hover:bg-white/10 transition-colors backdrop-blur-md shadow-lg mobile-touch-target">Citadel</button></Link>
            <Link href="/forge"><button className="px-4 sm:px-6 py-2 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest text-white/80 bg-black/20 border border-white/10 hover:bg-white/10 transition-colors backdrop-blur-md shadow-lg mobile-touch-target">Forge</button></Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* --- UPGRADE: MOBILE HEIGHT-SCALED MAIN CHAT TERMINAL --- */}
          <FloatingGlassCard designMode={designMode} className={`lg:col-span-2 bg-white/5 backdrop-blur-3xl border transition-all duration-1000 shadow-[0_30px_60px_rgba(0,0,0,0.5)] ${border}`}>
            <div className="flex flex-col h-[500px] sm:h-[650px] overflow-hidden rounded-3xl bg-gradient-to-b from-white/[0.05] to-transparent">
              <div className="bg-black/20 px-4 sm:px-8 py-4 sm:py-5 border-b border-white/5 flex justify-between items-center gap-2">
                <AnimatePresence mode="wait">
                  <motion.span 
                    key={headerText}
                    initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                    className={`text-[10px] sm:text-xs font-mono font-bold uppercase tracking-widest truncate max-w-[120px] sm:max-w-none ${secondary}`}
                  >
                    {headerText}
                  </motion.span>
                </AnimatePresence>

                {/* --- UPGRADE: INJECTED SOCIAL PORTAL CAROUSEL HUDBAR --- */}
                <div className="flex-shrink-0">
                  <SocialMatrixCarousel />
                </div>
              </div>
              
              <div ref={scrollRef} className="p-4 sm:p-8 font-mono text-xs sm:text-sm space-y-6 overflow-y-auto flex-1 scrollbar-hide">
                
                <AnimatePresence>
                  {activePositions.length > 0 && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-6">
                      <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-white/50 mb-3 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" /> Active Deployments
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {activePositions.map(pos => (
                          <div key={pos.id} className="bg-black/40 border border-white/10 rounded-xl p-4 backdrop-blur-md relative overflow-hidden">
                            <div className={`absolute top-0 left-0 w-1 h-full ${pos.pnl >= 0 ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,1)]' : 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,1)]'}`} />
                            <div className="flex justify-between items-start mb-2 pl-2">
                              <div>
                                <span className="text-white font-black text-base sm:text-lg">{pos.asset}</span>
                                <span className={`ml-2 text-[8px] sm:text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${pos.type === 'LONG' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                                  {pos.type} {pos.leverage}x
                                </span>
                              </div>
                              <div className="text-right">
                                <div className={`font-mono text-base sm:text-lg font-black tracking-tighter ${pos.pnl >= 0 ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`}>
                                  {pos.pnl >= 0 ? '+' : '-'}${Math.abs(pos.pnl).toFixed(2)}
                                </div>
                                <div className={`text-[8px] sm:text-[10px] font-bold ${pos.pnl >= 0 ? 'text-emerald-500/70' : 'text-red-500/70'}`}>
                                  {pos.pnlPercentage >= 0 ? '+' : ''}{pos.pnlPercentage.toFixed(2)}%
                                </div>
                              </div>
                            </div>
                            <div className="flex justify-between text-[8px] sm:text-[10px] font-mono text-white/60 pl-2 border-t border-white/5 pt-2 mt-2">
                              <span>ENTRY: ${(pos.entryPrice).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                              <span>LIVE: ${(pos.currentPrice).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {messages.map((msg) => {
                    if (!msg) return null; 
                    return (
                      <motion.div 
                        key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className={`flex flex-col gap-3 p-4 sm:p-5 rounded-2xl backdrop-blur-xl border shadow-lg ${
                          msg.role === 'user' ? 'bg-black/40 border-white/10 ml-8 sm:ml-16' : 
                          msg.role === 'ai' ? `${isOverclocked ? 'bg-red-950/20 border-red-500/20' : 'bg-emerald-950/20 border-emerald-500/20'} mr-8 sm:mr-16` : 
                          msg.role === 'error' ? 'bg-red-900/20 border-red-500/30 mr-8 sm:mr-16 animate-pulse' : 'bg-transparent border-transparent text-center'
                        }`}
                      >
                        {msg.role !== 'system' && (
                          <span className={`text-[8px] sm:text-[9px] uppercase font-bold tracking-[0.2em] ${msg.role === 'user' ? 'text-white/50' : secondary}`}>
                            {msg.role === 'user' ? 'COMMAND INPUT' : 'NEURAL OUTPUT'}
                          </span>
                        )}

                        {/* Collapsible Reasoning Logs */}
                        {msg.role === 'ai' && msg.thinkingSteps && msg.thinkingSteps.length > 0 && (
                          <ReasoningLogsHUD steps={msg.thinkingSteps} latency={msg.latency} />
                        )}

                        <p className={`leading-relaxed whitespace-pre-wrap font-medium ${msg.role === 'user' ? 'text-white' : msg.role === 'ai' ? 'text-white/95' : 'text-red-300 font-mono font-bold'}`}>{msg.text}</p>
                        
                        {msg.actionPayload && (
                          <div className={`mt-4 p-5 rounded-xl border backdrop-blur-md ${msg.actionPayload.status === 'SUCCESS' ? 'bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'bg-black/40 border-white/10'}`}>
                            
                            <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-3">
                              <span className="text-xs font-bold uppercase tracking-widest text-white/70 flex items-center gap-2">
                                <div className="w-1.5 h-3 bg-amber-400 rounded-full" /> AI Pre-Cognition Layer
                              </span>
                              {msg.actionPayload.status === 'SUCCESS' ? (
                                <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/>EXECUTED</span>
                              ) : (
                                <span className="text-[10px] text-amber-400 font-mono flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"/>{isTradeConfirming ? "AUTHORIZING SIGNATURE..." : "AWAITING SIGNATURE"}</span>
                              )}
                            </div>

                            <div className="mb-5 bg-white/5 p-4 rounded-lg border border-white/5 flex gap-4 items-start">
                                <div className="relative w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-full bg-black/40 border border-white/10 shadow-[inset_0_0_10px_rgba(255,255,255,0.05)]">
                                   <span className={`text-[10px] font-bold ${msg.actionPayload.confidence > 70 ? 'text-emerald-400' : msg.actionPayload.confidence > 50 ? 'text-amber-400' : 'text-red-400'}`}>{msg.actionPayload.confidence}%</span>
                                </div>
                                <div>
                                    <span className="text-[9px] uppercase tracking-widest text-white/50 block mb-1">STRATEGY ANALYSIS</span>
                                    <p className="text-xs text-white/85 font-mono leading-relaxed">{msg.actionPayload.analysis}</p>
                                </div>
                            </div>

                            {/* Option C Reasoning Hash inside the Action Card */}
                            {msg.decisionHash && (
                              <div className="mb-5 bg-black/50 p-4 rounded-lg border border-white/5 font-mono text-[9px] text-purple-400 flex gap-4 items-center">
                                 <span>PROVED_DECISION HASH:</span>
                                 <span className="break-all text-white/80">{msg.decisionHash}</span>
                              </div>
                            )}
                            
                            <div className="grid grid-cols-4 gap-4 mb-6">
                              <div className="bg-white/5 p-3 rounded-lg border border-white/5 text-center">
                                <span className="text-[9px] text-white/50 block mb-1">ASSET</span>
                                <span className="text-sm font-bold text-white">{msg.actionPayload.asset}</span>
                              </div>
                              <div className="bg-white/5 p-3 rounded-lg border border-white/5 text-center">
                                <span className="text-[9px] text-white/50 block mb-1">ACTION</span>
                                <span className={`text-sm font-bold ${msg.actionPayload.type === 'LONG' ? 'text-emerald-400' : msg.actionPayload.type === 'SHORT' ? 'text-red-400' : 'text-blue-400'}`}>{msg.actionPayload.type}</span>
                              </div>
                              <div className="bg-white/5 p-3 rounded-lg border border-white/5 text-center">
                                <span className="text-[9px] text-white/50 block mb-1">LEVERAGE</span>
                                <span className="text-sm font-bold text-white">{msg.actionPayload.leverage}x</span>
                              </div>
                              <div className="bg-white/5 p-3 rounded-lg border border-white/5 text-center">
                                <span className="text-[9px] text-white/50 block mb-1">COLLATERAL</span>
                                <span className="text-xs font-black uppercase text-purple-400">5.00 MAC</span>
                              </div>
                            </div>

                            {msg.actionPayload.status !== 'SUCCESS' ? (
                              <div className="flex gap-3">
                                <button 
                                  onClick={() => handleSignExecution(msg.id, msg.actionPayload!)}
                                  disabled={isTradeConfirming}
                                  className="flex-1 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-600/50 text-white font-bold text-xs py-3 rounded-xl uppercase tracking-widest shadow-[0_0_20px_rgba(147,51,234,0.3)] transition-all active:scale-95 mobile-touch-target"
                                >
                                  {isTradeConfirming ? "WRITING TO LEDGER..." : "CONFIRM & LOCK COLLATERAL"}
                                </button>
                                <button className="px-6 bg-transparent border border-white/10 text-white/75 hover:bg-white/5 font-bold text-xs rounded-xl uppercase tracking-widest transition-all mobile-touch-target">Cancel</button>
                              </div>
                            ) : (
                              <div className="w-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 text-center font-bold text-xs py-3 rounded-xl uppercase tracking-widest flex flex-col gap-1">
                                <span>Collateral Locked & Trade Active</span>
                                <a 
                                  href={`https://explorer.sepolia.mantle.xyz/tx/${txHash}`}
                                  target="_blank" rel="noopener noreferrer"
                                  className="text-[9px] text-purple-400 underline hover:text-purple-300 font-mono mobile-touch-target"
                                >
                                  Verified Decision ledger Certificate &gt;
                                </a>
                              </div>
                            )}
                          </div>
                        )}
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
                {isExecuting && (
                  <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }} className={`text-xs font-mono tracking-widest uppercase ${secondary} mr-16 p-5`}>
                    &gt; Processing neural matrix...
                  </motion.div>
                )}
              </div>

              <div className="p-6 bg-black/30 border-t border-white/5">
                <div className="flex gap-4 bg-black/40 p-2 rounded-2xl border border-white/5 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
                  <input 
                    type="text" value={command} onChange={(e) => setCommand(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleExecute()}
                    onFocus={() => !isOverclocked && setSystemState('LISTENING')}
                    onBlur={() => !isOverclocked && setSystemState('IDLE')}
                    placeholder="Enter executive command (e.g. 'Long ETH')..." 
                    className="flex-1 bg-transparent px-6 py-4 text-sm focus:outline-none text-white placeholder:text-white/40 font-mono pointer-events-auto"
                    disabled={isExecuting}
                  />
                  <button 
                    onClick={handleExecute} disabled={isExecuting || !command.trim()}
                    className={`px-10 rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all text-black mobile-touch-target ${
                      isOverclocked ? 'bg-red-500 hover:bg-red-400 shadow-[0_0_20px_rgba(239,68,68,0.3)]' : 'bg-white hover:bg-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                    } disabled:opacity-30 disabled:cursor-not-allowed`}
                  >
                    SEND
                  </button>
                </div>
              </div>
            </div>
          </FloatingGlassCard>

          {/* --- UPGRADE: MOBILE GRID LAYOUT COMPONENT DECK --- */}
          {/* Converts to 2-columns on mobile/tablet widths, keeping desktop vertical */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6 lg:gap-8 items-start">
            
            {/* ERC-8004 GOVERNANCE REGISTRY */}
            <FloatingGlassCard designMode={designMode} delay={0.2} className="bg-white/5 backdrop-blur-3xl p-8 border border-white/10 rounded-3xl shadow-[0_30px_60px_rgba(0,0,0,0.5)] transition-colors duration-500">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50 mb-6 border-b border-white/10 pb-4">
                ERC-8004 Governance Registry
              </h4>
              
              {isCheckingAgent ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-white/10 rounded w-2/3" />
                  <div className="h-3 bg-white/5 rounded w-1/2" />
                </div>
              ) : agentProfile ? (
                <div className="space-y-4 text-sharp-secondary">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-[10px] text-white/70 uppercase font-mono">RISK SETTING:</span>
                    <span className="text-xs font-bold text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.4)]">{agentProfile.riskStrategy}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-[10px] text-white/70 uppercase font-mono">MAX ALLOWABLE DRAWDOWN:</span>
                    <span className="text-xs font-bold text-red-400">{agentProfile.maxDrawdown}%</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-[10px] text-white/70 uppercase font-mono">MAX LEVERAGE LIMIT:</span>
                    <span className="text-xs font-bold text-emerald-400">
                      {agentProfile.riskStrategy.toLowerCase().includes("conservative") ? "5x Leverage" : 
                       agentProfile.riskStrategy.toLowerCase().includes("balanced") ? "10x Leverage" : "20x Leverage"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 p-3 rounded-xl mt-4">
                    <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                    <span className="text-[9px] font-mono text-purple-300">GOVERNANCE PARADIGM RE-ENFORCING TERMINAL TRANSACTIONS</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-xs text-white/60 mb-3">No active ERC-8004 identity found mapped to your address.</p>
                  <Link href="/citadel">
                    <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-emerald-400 hover:bg-white/10 transition-colors mobile-touch-target">
                      Awaken Identity
                    </button>
                  </Link>
                </div>
              )}
            </FloatingGlassCard>

            {/* SECOPS Sentinel MEMPOOL INTRUSION DETECTOR */}
            <FloatingGlassCard designMode={designMode} delay={0.1} className={`bg-white/5 backdrop-blur-3xl p-8 border ${border} rounded-3xl shadow-[0_30px_60px_rgba(0,0,0,0.5)] transition-colors duration-500`}>
              <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50 flex items-center gap-2">
                   <div className={`w-2 h-2 rounded-full ${secOpsActive ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_currentColor]' : 'bg-white/20'}`} />
                   Mantle SecOps Sentinel
                </span>
                <button 
                  onClick={() => setSecOpsActive(!secOpsActive)}
                  className={`text-[9px] font-mono uppercase tracking-widest px-3 py-1 rounded-md border mobile-touch-target ${
                    secOpsActive ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-white/5 border-white/10 text-white/50'
                  }`}
                >
                  {secOpsActive ? "ACTIVE" : "OFFLINE"}
                </button>
              </div>

              {secOpsActive ? (
                <div className="space-y-4">
                  <div className="font-mono text-[9px] text-sharp-secondary leading-relaxed bg-black/40 p-3 rounded-xl border border-white/5 space-y-1">
                     <div>MEMPOOL MONITORING: <span className="text-emerald-400">SECURE</span></div>
                     <div>REGISTRY BOUND: <span className="text-white">0x1E5B...5942</span></div>
                     {exploitAlert && <div className="text-red-400 font-bold uppercase animate-pulse mt-2">⚠️ FLASH LOAN ATTACK SIGNATURE FLAG</div>}
                  </div>

                  <AnimatePresence>
                    {exploitAlert && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-red-950/20 border border-red-500/30 p-4 rounded-xl mt-2"
                      >
                         <span className="text-[9px] text-red-400 font-mono uppercase block mb-1">DEFENSIVE INTERVENTION REQUIRED</span>
                         <p className="text-[10px] text-sharp-secondary font-mono leading-relaxed mb-4">Autonomous agent detects exploit vectors inside the pending mempool stream.</p>
                         
                         <button
                           onClick={handleRescueSecOps}
                           className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-widest rounded-xl shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all active:scale-95 mobile-touch-target"
                         >
                           {isSecuringRescue ? "BROADCASTING FRONT-RUN..." : "CONFIRM SECURE RESCUE"}
                         </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <p className="text-xs text-white/50 text-center py-2 font-mono">SecOps threat detection stream is standing by.</p>
              )}
            </FloatingGlassCard>

            {/* DYNAMIC YIELD WEAVER HUD CARD (AI x RWA) */}
            <AnimatePresence>
              {yieldWeaverMode !== "IDLE" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -20 }}
                  transition={{ duration: 0.4 }}
                  className="w-full"
                >
                  <FloatingGlassCard designMode={designMode} delay={0.3} className="bg-black/40 border border-purple-500/30 rounded-3xl p-6 shadow-[0_0_30px_rgba(168,85,247,0.25)]">
                    <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-4">
                      <span className="text-[10px] font-black tracking-widest text-purple-400 uppercase flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" /> AI Yield Weaver
                      </span>
                      <span className="text-[9px] font-mono text-white/50">Active: Mantle RWA</span>
                    </div>

                    <div className="space-y-3 mb-6 font-mono text-xs text-sharp-secondary">
                      <div className="flex justify-between">
                        <span className="text-white/60">Ondo USDY APY:</span>
                        <span className="text-white font-bold">5.1% APY</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/60">Mantle mETH APY:</span>
                        <span className="text-emerald-400 font-bold">7.2% APY</span>
                      </div>
                      <div className="flex justify-between border-t border-white/5 pt-2">
                        <span className="text-white/60">WEAVER ALLOCATION:</span>
                        <span className="text-purple-400 font-bold">
                          {yieldWeaverMode === "mETH_PREMIUM" ? "100% Mantle mETH" : "100% Ondo USDY"}
                        </span>
                      </div>

                      {yieldWeaverMode === "mETH_PREMIUM" && (
                        <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-lg text-emerald-400 text-[10px] gap-1 flex flex-col">
                          <span className="font-bold">🚀 PRE-COGNITIVE SWAP CONFIRMED</span>
                          <span>Yield path re-allocated successfully to maximize premium APY spreads.</span>
                        </div>
                      )}
                    </div>

                    {yieldWeaverMode !== "mETH_PREMIUM" && (
                      <button
                        onClick={handleWeaveYield}
                        className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 font-black text-[10px] text-white uppercase tracking-widest shadow-[0_0_20px_rgba(147,51,234,0.4)] transition-all active:scale-95 mobile-touch-target"
                      >
                        {isWeavingTx ? "AUTHORIZING SWAP..." : "EXECUTE PRE-COGNITIVE SWAP"}
                      </button>
                    )}
                  </FloatingGlassCard>
                </motion.div>
              )}
            </AnimatePresence>

            {/* --- COMPACTED MULTI-AGENT MATRIX RELAY CARD (SCROLL LOCKED) --- */}
            <FloatingGlassCard designMode={designMode} delay={0.2} className="bg-white/5 border border-white/10 rounded-3xl p-6 h-[220px]">
               <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-3 border-b border-white/10 pb-2 flex items-center gap-2 flex-shrink-0">
                 <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping" />
                 Mantle Agent Matrix Relay
               </h4>
               <div className="font-mono text-[9px] space-y-3 leading-relaxed text-sharp-secondary overflow-y-auto scrollbar-hide flex-1 max-h-[140px]">
                 <AnimatePresence>
                   {relayLogs.map((log) => (
                     <motion.div 
                       key={log.id} // Fix Framer Motion exiting key animation crash
                       initial={{ opacity: 0, x: -10 }} 
                       animate={{ opacity: 1, x: 0 }} 
                       exit={{ opacity: 0, scale: 0.95 }}
                       className="flex gap-2 border-b border-white/5 pb-2 last:border-0"
                     >
                       <span className={`${log.color} font-bold flex-shrink-0`}>[{log.agent}]:</span>
                       <span>{log.text}</span>
                     </motion.div>
                   ))}
                 </AnimatePresence>
               </div>
            </FloatingGlassCard>

            <FloatingGlassCard designMode={designMode} delay={0.4} className={`bg-white/5 backdrop-blur-3xl p-8 border ${border} rounded-3xl shadow-[0_30px_60px_rgba(0,0,0,0.5)] transition-colors duration-500`}>
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50 mb-8 border-b border-white/10 pb-4">
                Node Topology
              </h4>
              <div className="space-y-4">
                <div className="bg-black/30 border border-white/5 rounded-2xl p-5 flex justify-between items-center backdrop-blur-md shadow-[inset_0_0_15px_rgba(255,255,255,0.02)]">
                  <div>
                    <p className="text-sm font-bold text-white mb-1">Local Backend</p>
                    <p className={`text-[10px] font-mono drop-shadow-[0_0_5px_currentColor] ${secondary}`}>Port: 8000</p>
                  </div>
                  <div className={`w-3 h-3 rounded-full animate-pulse shadow-[0_0_15px_currentColor] ${dotBg}`} />
                </div>

                <div className="bg-black/30 border border-white/5 rounded-2xl p-5 flex justify-between items-center backdrop-blur-md shadow-[inset_0_0_15px_rgba(255,255,255,0.02)]">
                  <div>
                    <p className="text-sm font-bold text-white mb-1">Wallet Core</p>
                    <p className="text-[10px] font-mono text-sharp-secondary">{isConnected ? `${address?.slice(0, 6)}...${address?.slice(-4)}` : "Standby"}</p>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${isConnected ? `animate-pulse shadow-[0_0_15px_currentColor] ${dotBg}` : 'bg-white/10'}`} />
                </div>
              </div>
            </FloatingGlassCard>

            {/* RESTORED MARKET SENTINEL COMPONENT */}
            <FloatingGlassCard designMode={designMode} delay={0.6} className={`bg-transparent rounded-3xl shadow-[0_30px_60px_rgba(0,0,0,0.5)]`}>
              <div className="relative overflow-hidden rounded-3xl h-full w-full">
                <div className="relative h-full w-full">
                  <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                     <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">Market Sentinel</span>
                     <div className={`w-2 h-2 rounded-full animate-pulse ${currentMarket.bg}`} />
                  </div>
                  
                  <AnimatePresence mode="wait">
                    <motion.div 
                      key={currentMarket.symbol}
                      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                      className="text-center mb-6"
                    >
                       <div className="text-4xl font-black text-white drop-shadow-md">
                         {(livePrices as any)[currentMarket.pair]}
                       </div>
                       <div className={`text-[12px] font-bold tracking-widest mt-1 ${currentMarket.color} ${currentMarket.glow}`}>
                         {currentMarket.name}
                       </div>
                    </motion.div>
                  </AnimatePresence>

                  <div className="flex gap-3">
                     <button className={`flex-1 ${currentMarket.bg} ${currentMarket.color} border ${currentMarket.border} rounded-xl py-3 text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all transform hover:-translate-y-1 active:scale-95 mobile-touch-target`}>Long</button>
                     <button className="flex-1 bg-red-500/10 text-red-400 border border-red-500/30 rounded-xl py-3 text-xs font-black uppercase tracking-widest hover:bg-red-500/30 hover:shadow-[0_0_20px_rgba(239,68,68,0.2)] transition-all transform hover:-translate-y-1 active:scale-95 mobile-touch-target">Short</button>
                  </div>
                </div>
              </div>
            </FloatingGlassCard>

            {/* DYNAMIC SOVEREIGN REFUEL Sentinel HUDBLOCK */}
            <AnimatePresence>
               {isConnected && address && mntGasBalance < 1.0 && (
                 <motion.div
                   initial={{ opacity: 0, scale: 0.9, y: 20 }}
                   animate={{ opacity: 1, scale: 1, y: 0 }}
                   exit={{ opacity: 0, scale: 0.9, y: -20 }}
                   transition={{ duration: 0.4 }}
                   className="w-full"
                 >
                   <FloatingGlassCard designMode={designMode} delay={0.2} className="bg-black/40 border border-amber-500/30 rounded-3xl p-6 shadow-[0_0_30px_rgba(245,158,11,0.25)] animate-pulse">
                     <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-4">
                       <span className="text-[10px] font-black tracking-widest text-amber-500 uppercase flex items-center gap-2">
                         <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" /> Gas Sentinel Alert
                       </span>
                       <span className="text-[9px] font-mono text-white/50">TREASURY ACTIVE</span>
                     </div>

                     <div className="space-y-3 mb-6 font-mono text-xs text-sharp-secondary">
                       <div className="text-red-400 font-bold uppercase">🚨 GAS EXHAUST DETECTED</div>
                       <div className="flex justify-between text-white/70">
                         <span>Your Wallet Balance:</span>
                         <span className="text-red-400 font-bold">{mntGasBalance.toFixed(4)} MNT</span>
                       </div>
                       <p className="text-[10px] text-sharp-secondary leading-relaxed pt-2 border-t border-white/5">
                         Your gas balance is insufficient to authorize on-chain executions. Swap 5.00 MAC for an immediate native 2.00 MNT autonomous refuel.
                       </p>
                       
                       {refuelResultHash && (
                         <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-lg text-emerald-400 text-[10px] gap-1 flex flex-col mt-2">
                           <span className="font-bold">🚀 REFUELED SUCCESSFUL</span>
                           <span className="break-all text-[8px] sm:text-[9px]">TX: {refuelResultHash}</span>
                         </div>
                       )}
                     </div>

                     {!refuelResultHash && (
                       <button
                         onClick={handleRequestRefuel}
                         className="w-full py-3 rounded-xl bg-amber-500 text-black hover:bg-amber-400 font-black text-[10px] uppercase tracking-widest shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all active:scale-95 mobile-touch-target"
                       >
                         {isRefueling ? "TRANSFERRING GAS..." : isRefuelFeePending ? "CONFIRMING FEE SWAP..." : "REQUEST GAS REFUEL"}
                       </button>
                     )}
                   </FloatingGlassCard>
                 </motion.div>
               )}
            </AnimatePresence>

            <FloatingGlassCard designMode={designMode} delay={0.4} className="bg-transparent h-[80px]">
              <button 
                onClick={() => open()} 
                className="w-full h-full rounded-2xl bg-white text-black hover:bg-emerald-400 transition-colors font-black text-xs uppercase tracking-[0.2em] shadow-[0_20px_40px_rgba(255,255,255,0.1)] hover:shadow-[0_20px_40px_rgba(16,185,129,0.3)] active:scale-95 mobile-touch-target"
              >
                {isConnected ? "Connection Active" : "Bridge Wallet"}
              </button>
            </FloatingGlassCard>
          </div>

        </div>
      </motion.div>
    </main>
  );
}