# 🛡️ Mantle Agentic Core (MAC)

<!-- 
“Must always include our chat rule from the beginning of this section to the end the rules and ways in all code outputs and design assets.”
-->

Mantle Agentic Core (MAC) is an autonomous, on-chain Operating System and financial co-pilot built exclusively for the Mantle ecosystem. 

MAC bridges the gap between natural language processing (LLM) and raw EVM blockchain execution. By coupling an asynchronous FastAPI intent parsing backend with on-chain risk registries (ERC-8004), sovereign treasury signing wallets, and active mempool security sentinels, MAC introduces a secure, pre-cognitive operating layer for decentralized finance.

---

## 🚀 Live Deployments & Addresses

* **Production Frontend dApp (Vercel):** https://mantle-agentic-core.vercel.app/
* **Production API Backend (Render):** https://mantle-agentic-core.onrender.com/
* **Target Ledger Network:** Mantle Sepolia (Chain ID: 5003)
* **Mantle Agent Token (MAC) ERC-20:** `0x69465a67c1C4860f89f2D80fab5dADF33495d171`
* **ERC-8004 Identity Registry:** `0x1E5B64264089aacC547A1506402B94f909215942`
* **Mantle Agent Escrow Contract:** Compiled & Verified (`contracts/MantleAgentEscrow.sol`)

---

## 🏆 Hackathon Track Alignment & Feature Inventory

### 1. Agentic Wallets & Economy Track (Track 6)
* **Sovereign Server-Side Signer:** The Python backend holds treasury signing authority. It dynamically parses natural language transfers (e.g., "send 2 MAC to 0x..."), converts target addresses to EIP-55 checksum-compliant strings, and broadcasts transactions autonomously to Mantle Sepolia.
* **On-Chain Collateral Escrows:** To open a leverage trade, users must execute a client-side MetaMask signature locking 5 MAC tokens into a secure escrow. The simulated trade card only mounts and tracks live PnL once the transaction is officially mined on-chain.
* **The Autonomous Gas Tank:** If a user’s connected wallet gas balance drops below 1.0 MNT, the Gas Sentinel Alert is triggered. Users sign a 5 MAC fee payment to authorize our backend treasury, which autonomously transfers 2.00 native MNT back to their address on-chain.

### 2. AI x RWA Track (Track 3)
* **The AI Yield Weaver:** This module resolves dynamic yield optimization between mETH (Mantle LSP, yielding ~7.2% APY) and Ondo USDY (Tokenized Treasury RWA, yielding ~5.1% APY).
* **Pre-Cognitive Yield Swaps:** The user can authorize our pre-cognitive agent to perform dynamic swaps. Signing the transaction shifts their escrowed capital allocations dynamically to capture premium yield spreads across Ondo and Mantle.

### 3. AI DevTools Track (Track 5)
* **Neural Forge AST Auditor:** The Forge parses raw Solidity code or natural language descriptions. It audits codebases for exploits (reentrancy, overflows) and returns secure compiled code blocks.
* **EVM Paris-Compatible Launchpad:** Integrates a constructor-free compilation engine. Once a contract is generated, the UI mounts the Mantle Deployer active HUD, allowing developers to deploy gas-optimized, tested bytecode directly to Mantle Sepolia in one click with zero initialization arguments.

### 4. Best UI/UX Award & Consumer DApps (Track 4)
* **3D Liquid Glass Aesthetic:** Built with Next.js, Framer Motion, and Tailwind. All panels render high backdrop blurs, organic background vector wave meshes, and calculated mouse-perspective perspective tilting.
* **4-Way Design System Matrix:** The entire dashboard breathes and transitions its color scheme (Emerald, Gold, Purple, and Crimson) in real-time based on the active processing and transaction states of the AI agent, fully adjustable between `SILENT` (Default), `CHROME`, `AURA`, and `CYBER` modes.
* **The Symmetrical TVC Ledger & Live Block Stream:** Integrates an active scrolling SVG performance graph and a real-time Mantle Sepolia transaction stream that queries the latest blocks via RPC to display raw blockchain telemetry on-flight.
* **Turing Agentic Bias Auditor:** A real-time fairness auditing dashboard evaluating EVM gas optimization indexes, token selection biases, and registry execution parities.

---

## ⚙️ Technical Architecture & Data Directory

```text
                  [ Next.js Frontend dApp ]
                     /       |       \
       (API Handshake)  (Wagmi)  (Aura Engine)
                   /         |         \
   [ FastAPI Backend ]  [ Mantle RPC ]  [ Theme Context ]
         /       \           |
   [Postgres] [Web3.py]   [ERC-8004]
    (Neon)    (Signer)   (Registry)
```

### Repository Structure
```text
my-ai-agent/
├── backend/
│   ├── main.py                     # FastAPI ASGI Server & Bot Daemons
│   ├── MantleAgentABI.json         # Compiled Contract ABI Consumed by Web3.py
│   ├── requirements.txt            # Python Dependencies
│   └── mac_history.db              # SQLite Local Fallback Database
├── dashboard/
│   ├── src/
│   │   ├── app/
│   │   │   ├── citadel/page.tsx    # ERC-8004 Citadel Identity Minter View
│   │   │   ├── forge/page.tsx      # Neural Forge Compiler & Audit Workspace
│   │   │   ├── layout.tsx          # Root Layout & Particle Background Settings
│   │   │   ├── page.tsx            # Main Terminal Dashboard & Turing Modals
│   │   │   └── ThemeContext.tsx    # Global Visual Theme State-Machine
│   │   ├── config.ts               # Wagmi Adapter Network Configurations
│   │   └── context.tsx             # Reown AppKit UI Initializers
│   └── next.config.ts              # Webpack Polyfills & Externals Mappings
└── mantle-agent-contracts/
    ├── contracts/
    │   ├── ERC8004Identity.sol     # ERC-721 Risk Strategy Identity NFT
    │   ├── MantleAgentToken.sol    # MAC Utility Token Contract
    │   └── MantleAgentEscrow.sol   # On-Chain Collateral Staking Escrow
    ├── scripts/
    │   ├── deploy.js               # MAC Token Deployment Script
    │   ├── deployIdentity.js       # ERC-8004 Registry Deployment Script
    │   └── deployEscrow.cjs        # Escrow Vault Deployment Script (CommonJS)
    ├── test/
    │   └── MantleAgentEscrow.test.js # Complete 9-Scenario ES Module Unit Tests
    └── hardhat.config.js           # Hardhat Compiler & Toolbox Configurations
```

---

## 🤖 Telegram & Discord Bot Relays

Mantle Agentic Core is equipped with background-running bot relays that boot automatically inside daemon threads under the FastAPI lifecycle on your Render production container.

* **Telegram Bot Handle:** [`@MantleAgenticBot`](https://t.me/MantleAgenticBot)
* **Discord Bot ID:** `Mantle Agentic Core#3046`

### Unified Cross-Platform Web3 Linking
By tying Telegram and Discord IDs directly to SQLite/PostgreSQL wallet addresses, we have established a **single, omnipresent entity**:
* **`/link <wallet_address>`:** Links your Telegram/Discord account to your active Web3 Wallet. Your chat history on the 3D web dApp dashboard is now fully synchronized with your mobile chat logs.
* **`/citadel mint <Strategy> <Drawdown>:`** Creates a Virtual Agent Profile in database memory. When you log into the web dApp, it detects this draft and prompts you to mint it on-chain in one click.
* **`/citadel`:** Launches real-time Web3.py JSON-RPC queries to the Mantle Sepolia ledger to check your active on-chain risk strategy.
* **`/forge <concept>:`** Generates, compiles, and audits complete, secure Solidity contracts instantly.
* **`/portfolio`:** Fetches your active leveraged trading positions directly in the chat window.

---

## 📖 The Neural Forge & Hardhat Troubleshooting Ledger

Here is the structured ledger detailing every error encountered during this deployment phase, along with its permanent, verified solution:

| # | Error / Warning | Root Cause | Permanent Engineering Solution |
| :-: | :--- | :--- | :--- |
| **01** | `ReferenceError: require is not defined in ES module scope` | The project’s `package.json` has `"type": "module"`, making standard `.js` files ES Modules where CommonJS `require()` is forbidden. | Rename CommonJS scripts to use the **`.cjs`** extension (e.g. `deployEscrow.cjs`), or convert them to use modern ES6 `import`/`export` syntax. |
| **02** | `Error HHE1200: Cannot determine a test runner` | Hardhat’s config only imported the narrow `@nomicfoundation/hardhat-ethers` library instead of the complete `hardhat-toolbox` plugin. Mocha/Chai were not registered, so Hardhat didn't know what test runner to use to compile and execute `.js` test files. | 1. Import **`@nomicfoundation/hardhat-toolbox`** inside your `hardhat.config.js`.<br>2. Convert the test script (`MantleAgentEscrow.test.js`) to use native ES Modules **`import`** syntax. |
| **03** | `@nomicfoundation/hardhat-toolbox` version mismatch | Installing the `@latest` tag of the toolbox plugin defaults to a version incompatible with Hardhat 2.x. | Install the explicit Hardhat 2-compatible tag: `npm install --save-dev \"@nomicfoundation/hardhat-toolbox@hh2\"`. |
| **04** | `npm error ERESOLVE unable to resolve dependency tree` | Strict `npm` version matching locks conflicting peer dependencies (e.g., project `hardhat-ethers` v4.x vs. plugin expected v3.x). | Force the installation using the **`--legacy-peer-deps`** flag to bypass strict peer checks. |
| **05** | `Error [ERR_PACKAGE_PATH_NOT_EXPORTED]: Package subpath './common/bigInt' is not defined` | Your project’s core `hardhat` package is outdated and does not export the `bigInt` modules expected by the new testing plugins. | Upgrade the core `hardhat` dependency to **`hardhat@^2.22.0`** using the `--legacy-peer-deps` flag. |
| **06** | `npm error network read ECONNRESET` | The system is trying to route package downloads through your phone proxy (`192.168.49.1:8282`), which is now offline. | Remove the proxy configurations from your settings: run `npm config rm proxy`. |
| **07** | `Error: EPERM: operation not permitted, rmdir` | Windows is locking folders inside `node_modules` because an active terminal or editor process is currently referencing them. | Close all terminal sessions (or restart VS Code) to release the locks, then run your npm command. |
| **08** | `TypeError: Cannot read properties of undefined (reading 'getSigners')` (Top-level imports) | Under strict ES Modules, loading the default `hre` object statically can execute before the ethers plugin dynamically binds its methods to the environment. | Bypass the default import entirely and **import `ethers` directly as a named export from `"hardhat"`**: `import { ethers } from \"hardhat\";`. |
| **09** | `TypeError: Cannot read properties of undefined (reading 'getSigners')` (Inside tests) | `@nomicfoundation/hardhat-ethers` v4.x (built for Hardhat 3) is installed in your project, which the Hardhat 2 runtime ignores, leaving `hre.ethers` uninitialized. | Downgrade the dependency to **`@nomicfoundation/hardhat-ethers@^3.0.8`** using the `--legacy-peer-deps` flag. |
| **10** | `TypeError: Cannot read properties of undefined (reading 'getSigners')` (Asynchronous race-condition) | Destructuring `ethers` statically at the top of an ES Module test file captures it as `undefined` because the file parses before the Hardhat Runtime Environment (HRE) has finished loading its plugins asynchronously. | **Erase top-level destructuring.** Always destructure and pull `ethers` dynamically inside the active `beforeEach` hook (`const { ethers } = hre;`) after the HRE has fully booted. |
| **11** | `Error: Transaction reverted: function returned an unexpected amount of data` | The `MantleAgentEscrow` contract constructor resolved `macToken = IERC20(address(macToken))` before the state variable was initialized, mapping it to `address(0)`. Direct calls on `address(0)` returned empty data. | Directly initialize the variable with the input constructor parameter: `macToken = IERC20(_macTokenAddress);`. |
| **12** | `BOT PROCESS FAILURE: name 'DATABASE_URL' is not defined` | The global scope resolution for the string `DATABASE_URL` would occasionally fail inside asynchronous background bot thread workers. | Completely eliminate local variable bindings; query the environment directly inside connection pools using `os.getenv(\"DATABASE_URL\")`. |

---

## 🛠️ Local Installation & Configuration Guide

### 1. Backend Engine Setup
Navigate to the backend directory, install dependencies, and launch the FastAPI server:

```bash
cd backend
pip install -r requirements.txt
```

Create a `.env` file inside `backend/.env` with the following variables:

```env
GROQ_API_KEY="your_groq_api_key"
PRIVATE_KEY="your_wallet_signing_private_key"
MANTLE_RPC_URL="https://rpc.sepolia.mantle.xyz"
MAC_TOKEN_ADDRESS="0x69465a67c1C4860f89f2D80fab5dADF33495d171"
TELEGRAM_BOT_TOKEN="your_telegram_bot_token_here"
DISCORD_BOT_TOKEN="your_discord_bot_token_here"
TWITTER_CONSUMER_KEY="your_twitter_api_key"
TWITTER_CONSUMER_SECRET="your_twitter_key_secret"
TWITTER_ACCESS_TOKEN="your_twitter_access_token"
TWITTER_ACCESS_TOKEN_SECRET="your_twitter_access_token_secret"
DATABASE_URL="your_postgresql_database_connection_url_optional_for_sqlite_fallback"
RENDER_EXTERNAL_URL="your_deployed_render_app_url"
```

Run the local development server:
```bash
uvicorn main:app --reload --port 8000
```

### 2. Frontend Next.js Setup
Navigate to your dashboard directory, install dependencies, and run your development environment:

```bash
cd dashboard
pnpm install
```

Create a `.env.local` file inside `dashboard/.env.local` containing your Reown Project ID:
```env
NEXT_PUBLIC_PROJECT_ID="your_reown_project_id"
```

Launch the development server:
```bash
pnpm run dev
```

Open `http://localhost:3000` in your browser.

---

## 📄 License
This repository is licensed under the MIT License. Created for the Turing Test Hackathon 2026.
```
 Quadruple backtick wrapper closes here