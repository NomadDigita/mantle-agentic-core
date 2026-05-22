# 🛡️ Mantle Agentic Core (MAC)

An advanced, autonomous on-chain Operating System and next-generation financial co-pilot built exclusively for the Mantle ecosystem. 

Mantle Agentic Core (MAC) bridges the gap between Natural Language Processing (LLM) and raw EVM execution. By coupling a python-driven intent parsing network with on-chain risk registries (ERC-8004), sovereign treasury wallets, and active mempool sentinels, MAC introduces a secure, pre-cognitive operating layer for decentralized finance.

---

## 🚀 Live Deployments & Addresses

* Production Frontend (Vercel): mantle-agentic-core.vercel.app
* Production API Backend (Render): mantle-agentic-core.onrender.com
* Target Ledger Network: Mantle Sepolia (Chain ID: 5003)
* Mantle Agent Token (MAC) ERC-20: 0x69465a67c1C4860f89f2D80fab5dADF33495d171
* ERC-8004 Identity Registry: 0x1E5B64264089aacC547A1506402B94f909215942

---

## 🏆 Hackathon Track Alignment & Feature Inventory

### 1. Agentic Wallets & Economy Track
* Sovereign Server-Side Signer: The Python backend holds treasury signing authority. It dynamically parses natural language transfers (e.g., "send 2 MAC to 0x..."), converts target addresses to EIP-55 checksum-compliant strings, and broadcasts transactions autonomously to Mantle Sepolia.
* On-Chain Collateral Escrows: To open a leverage trade, users must execute a client-side MetaMask signature locking 5 MAC tokens into a secure escrow. The simulated trade card only mounts and tracks live PnL once the transaction is officially mined on-chain.
* The Autonomous Gas Tank: If a user’s connected wallet gas balance drops below 1.0 MNT, the Gas Sentinel Alert is triggered. Users sign a 5 MAC fee payment to authorize our backend treasury, which autonomously transfers 2.00 native MNT back to their address on-chain.

### 2. AI x RWA Track
* The AI Yield Weaver: This module resolves dynamic yield optimization between mETH (Mantle LSP, yielding ~7.2% APY) and Ondo USDY (Tokenized Treasury RWA, yielding ~5.1% APY).
* Pre-Cognitive Yield Swaps: The user can authorize our pre-cognitive agent to perform dynamic swaps. Signing the transaction shifts their escrowed capital allocations dynamically to capture premium yield spreads across Ondo and Mantle.

### 3. AI DevTools Track
* Neural Forge AST Auditor: The Forge parses raw Solidity code or natural language descriptions. It audits codebases for exploits (reentrancy, overflows) and returns secure compiled code blocks.
* EVM Paris-Compatible Launchpad: Integrates a constructor-free compilation engine. Once a contract is generated, the UI mounts the Mantle Deployer active HUD, allowing developers to deploy gas-optimized, tested bytecode directly to Mantle Sepolia in one click with zero initialization arguments.

### 4. Best UI/UX Award & Consumer DApps
* 3D Liquid Glass Aesthetic: Built with Next.js, Framer Motion, and Tailwind. All panels render high backdrop blurs, organic background vector wave meshes, and calculated mouse-perspective perspective tilting.
* Semantic Aura Engine (ThemeContext): The entire dashboard breathes and transitions its color scheme (Emerald, Gold, Purple, and Crimson) in real-time based on the active processing and transaction states of the AI agent.
* The Matrix Relay: An animated multi-agent log sequencer displaying live, scrolling communication loops between specialized sub-agents (Yield Scribe, Sentinel Hub, Alpha Trace) as they coordinate on-chain tasks.

---

## ⚙️ Technical Architecture & Data Directory

                  [ Next.js Frontend dApp ]
                     /       |       \
       (API Handshake)  (Wagmi)  (Aura Engine)
                   /         |         \
   [ FastAPI Backend ]  [ Mantle RPC ]  [ Theme Context ]
         /       \           |
      [Groq]  [Web3.py]   [ERC-8004]
    (Llama)   (Signer)   (Registry)

---

## 🛠️ Local Installation & Configuration Guide

### 1. Backend Engine Setup
Navigate to the backend directory, install dependencies, and launch the FastAPI server:

Command: cd backend
Command: pip install -r requirements.txt

Create a .env file inside backend/.env with the following variables:

GROQ_API_KEY="your_groq_api_key"
PRIVATE_KEY="your_wallet_signing_private_key"
MANTLE_RPC_URL="https://rpc.sepolia.mantle.xyz"
MAC_TOKEN_ADDRESS="0x69465a67c1C4860f89f2D80fab5dADF33495d171"

Run the local development server:

Command: uvicorn main:app --reload --port 8000

### 2. Frontend Next.js Setup
Navigate to your dashboard directory, install dependencies, and run your development environment:

Command: cd dashboard
Command: npm install

Create a .env.local file inside dashboard/.env.local containing your Reown Project ID:

NEXT_PUBLIC_PROJECT_ID="your_reown_project_id"

Launch the development server:

Command: npm run dev

Open http://localhost:3000 in your browser.

---

## 📄 License
This repository is licensed under the MIT License. Created for the Turing Test Hackathon 2026.