# Mantle Agentic Core (MAC)

/*
“Must always include our chat rule from the beginning of this section to the end the rules and ways in all code outputs and design assets.”
*/

An autonomous, multi-client, pre-cognitive Web3 operations engine built for the Mantle Network. Mantle Agentic Core (MAC) bridges natural language intents with live on-chain executions, persistent cloud databases, and cryptographic risk registries.

---

## 1. System Architecture & Infographics

Below is the conceptual layout of the Mantle Agentic Core's operational pipelines and database relays:

    +───────────────────────────────────────────────────────────────────────────+
    │                             USER CLIENT DECK                              │
    │   +───────────────────+   +───────────────────+   +───────────────────+   │
    │   │  Web dApp Console │   │   Telegram Bot    │   │    Discord Bot    │   │
    │   +─────────┬─────────+   +─────────┬─────────+   +─────────┬─────────+   │
    +─────────────┼───────────────────────┼───────────────────────┼─────────────+
                  │                       │                       │
                  ▼                       ▼                       ▼
    +───────────────────────────────────────────────────────────────────────────+
    │                       CENTRAL CLOUD SYNC: SUPABASE                        │
    │   +───────────────────────────────────────────────────────────────────+   │
    │   │                       PostgreSQL Tables                           │   │
    │   │  [chat_history]  [user_bindings]  [virtual_identities]            │   │
    │   +─────────────────────────────────┬─────────────────────────────────+   │
    +─────────────────────────────────────┼─────────────────────────────────────+
                                          │
                                          ▼
    +───────────────────────────────────────────────────────────────────────────+
    │                        AI ENGINE & ORACLE HUB (Render)                    │
    │   +───────────────────────────────────────────────────────────────────+   │
    │   │  FastAPI Router -> Llama-3.1-8b (Primary) / Gemini 3.5 (Fallback) │   │
    │   │  Bybit Spot Market Oracles & Mantle RPC ledger parsers            │   │
    │   +─────────────────────────────────┬─────────────────────────────────+   │
    +─────────────────────────────────────┼─────────────────────────────────────+
                                          │
                                          ▼
    +───────────────────────────────────────────────────────────────────────────+
    │                     MANTLE TESTNET BLOCKCHAIN (Chain 5003)                │
    │   +───────────────────+   +───────────────────+   +───────────────────+   │
    │   │  ERC-8004 Registry│   │ MAC Token Contract│   │ Escrow Vault      │   │
    │   │  (MAI Identity)   │   │  (MAC ERC-20)     │   │ (Collateral Lock) │   │
    │   +───────────────────+   +───────────────────+   +───────────────────+   │
    +───────────────────────────────────────────────────────────────────────────+

---

## 2. Directory Structure & File Map

The codebase is organized into three primary operational blocks, dividing backend services, Next.js frontend pages, and Hardhat development testing units:

    my-ai-agent/
    ├── backend/
    │   ├── main.py                     # FastAPI backend app, Discord & Telegram loops
    │   ├── requirements.txt            # Python backend dependencies
    │   ├── MantleAgentABI.json         # ABI descriptor for MAC token smart contract
    │   └── .env                        # Private keys, secure API keys, and bot tokens
    ├── dashboard/
    │   ├── src/
    │   │   ├── app/
    │   │   │   ├── citadel/
    │   │   │   │   └── page.tsx        # ERC-8004 Citadel Vault registration interface
    │   │   │   ├── forge/
    │   │   │   │   └── page.tsx        # Neural Forge smart contract auditor page
    │   │   │   ├── globals.css         # Styling, laser keyframes, and custom fonts
    │   │   │   ├── layout.tsx          # TSParticles, Web3 provider wrappers, and layout
    │   │   │   ├── ThemeContext.tsx    # Centralized state context & safe color pallet
    │   │   │   └── page.tsx            # Main Chat Terminal & central workspace view
    │   │   └── context/
    │   │       ├── config.ts           # AppKit multi-chain configurations
    │   │       └── context.tsx         # AppKit client instance & theme provider
    │   ├── next.config.ts              # Webpack externals and fallback rules
    │   ├── package.json                # Frontend dependency declarations
    │   └── tsconfig.json               # TypeScript compiler configurations
    └── asiwaju-trading-companion/     # Base Sepolia reference registration scripts

---

## 3. On-Chain Smart Contract Registry

The on-chain infrastructure of Mantle Agentic Core is compiled using Solidity `^0.8.20` and successfully deployed on the **Mantle Sepolia Testnet (Chain ID: 5003)**:

*   **Mantle Agent Core Token (MAC)**: `0x69465a67c1C4860f89f2D80fab5dADF33495d171`
    *   Ecosystem utility and collateral asset. Implements automated deflationary mechanics (2% burn fee, 3% liquidity tax) on transfers.
*   **ERC-8004 Identity Registry (MAI)**: `0x1E5B64264089aacC547A1506402B94f909215942`
    *   Registers sovereign autonomous identities (MAI NFTs). Couples wallets with specialized risk parameters (Strategy settings, hard stop Drawdowns) directly on the ledger.
*   **Mantle Agent Escrow Vault**: `0x69465a67c1C4860f89f2D80fab5dADF33495d171` (Companion Contract)
    *   Secures MAC token collateral for active operational sessions, enabling programmatically enforced releasing or seizing of collateral during trades.

---

## 4. Database Schema Mappings (Supabase Centralization)

To prevent data loss on server restarts, MAC uses Supabase PostgreSQL as its central data engine, completely removing local storage dependencies. 

The tables inside the SQL Editor are structured as follows:

    -- Chat history mapping per session
    create table if not exists chat_history (
        id text primary key,
        wallet_address text,
        role text,
        text text,
        action_payload text,
        thinking_steps text,
        latency text,
        decision_hash text,
        timestamp double precision
    );

    -- Cross-client wallet bindings
    create table if not exists user_bindings (
        id text primary key,
        platform text,
        platform_user_id text,
        wallet_address text
    );

    -- Virtual and drafted agent risk strategies
    create table if not exists virtual_identities (
        wallet_address text primary key,
        risk_strategy text,
        max_drawdown integer,
        timestamp double precision
    );

    -- Deployed solidity contracts tracker
    create table if not exists deployed_contracts (
        id text primary key,
        wallet_address text,
        contract_address text,
        contract_name text,
        bytecode text,
        abi text,
        timestamp double precision
    );

---

## 5. Front-End UI/UX Design System

Mantle Agentic Core is designed to project a high-contrast, professional, and unified developer console experience, utilizing several layout paradigms:

*   **Vite-Style Sleek Layout**: Sidebar layout structure with compact margins, narrow panels, and clear column dividers to maximize space on desktop and keep views highly organized.
*   **Liquid Glass Backgrounds**: Main panels are styled using custom backdrop blurs, subtle border-glow outlines, and translucent overlays (`backdrop-blur-3xl`, `bg-white/5`), making background particle movements elegantly visible underneath elements.
*   **Liquid Glass Sticky Header**: The main header panel remains statically locked at the top of the viewport (`sticky top-0 z-50`). Other body elements roll under the header when scrolling, reinforcing the translucent glass depth.
*   **Brand-Adaptive Sentinel Themes**: The Market Sentinel card supports real-time Bybit ticker feeds. Switching between **BTC**, **ETH**, and **MNT** dynamically changes the card outline glow, text accents, and border laser sweep animations:
    *   **BTC**: Orange/Amber theme (`#f59e0b`).
    *   **ETH**: Indigo/Blue theme (`#6366f1`).
    *   **MNT**: Mantle Green theme (`#00ffa3`).
*   **Performance Optimization**: Particle density has been reduced, and SVG layout rendering has been streamlined, to prevent frame drops on mobile browsers.

---

## 6. Core Operational Modules

### 01. Central Terminal Chat Workspace
The terminal connects directly to your FastAPI backend server. It translates natural language statements (e.g. `"Long MNT 10x"`) into valid on-chain intents. When a trade is parsed, the terminal displays an "AI Pre-Cognition Layer" card detailing reasoning trace, confidence scores, transaction parameters, and secure decision hashes.

### 02. Citadel Vault (ERC-8004 Identity Registration)
Provides an interface to mint sovereign ERC-8004 Risk Strategy Identity NFTs. 
*   **Navigation Manual**: Click "Citadel" in the top header. Configure your management parameter, select a Strategy (Conservative, Balanced, or Aggressive), define your drawdown limit, and click "Awaken Agent Identity". Authorize the transaction inside MetaMask/Bitget.
*   **Dynamic Syncing**: On confirmation, your dApp automatically posts the minted risk strategy to your Supabase `virtual_identities` table. The main dashboard and bot engines will instantly detect this active identity.

### 03. Neural Forge (Auditor & Compiler HUD)
Allows users to generate, compile, and audit complete smart contracts.
*   **Navigation Manual**: Click "Forge" in the top header. Paste any Solidity contract, or write a prompt (e.g. `"Write an ERC20 contract"`), and click "Initiate Forge".
*   **Compiler Stack**: The backend processes the prompt and returns verified Solidity files. The dApp provides a direct on-chain deployer to push your compiled bytecode to Mantle Sepolia. The deployed contract address is then synced to your Supabase `deployed_contracts` history table.

### 04. SecOps Sentinel Shield
Monitors pending transactions inside the Mantle Sepolia mempool. If the Sentinel flags any reentrancy exploit patterns targeting your smart contracts, it prompts the dApp console with a Whitehat rescue option, allowing you to instantly secure contract balances.

### 05. AI Yield Weaver & Moe Swap Router
Compares live staking APYs between Ondo Finance USDY RWA and Mantle mETH LSP. Clicking "Execute Swap" triggers a real, on-chain swap transaction, using MetaMask to execute a swap of native MNT tokens directly for mETH, securing yield premiums.

### 06. Sovereign Gas Refuel
Monitors your wallet's gas balance. If it drops below `1.0 MNT`, the dApp allows you to lock 5.0 MAC tokens as fee collateral and request a gas refuel. The backend FastAPI treasury then instantly transfers `2.0 native MNT` to your address.

---

## 7. Bot Relay Commands & Operating Manual

The backend main thread hosts automated background Telegram and Discord bots, synchronized directly with your central Supabase database.

### Command Catalog
*   `/help` or `!mac help` (catalog menu guide)
*   `/link <0x_address>` or `!mac link <0x_address>` (binds Discord/Telegram IDs to Web dApp wallet addresses)
*   `/citadel` or `!mac citadel` (checks on-chain ERC-8004 NFT status and risk variables)
*   `/citadel mint <Strategy> <Drawdown>` (registers virtual identity parameters inside database)
*   `/forge <concept>` (compiles and audits custom contract solidity code)
*   `/portfolio` or `!mac portfolio` (lists active leveraged contract deployments from Supabase)

---

## 8. Pricing Mechanics for the MAC Token

To establish a live, public trading price for the ecosystem utility token (`MAC`) on the Mantle Sepolia network, you must configure a Decentralized Exchange (DEX) liquidity pool:

1. Navigate to the testnet interface of a Mantle DEX (such as **Merchant Moe** or **Agni Finance**).
2. Create a new pool pairing your deployed `MantleAgentToken` contract address (`0x69465a67c1C4860f89f2D80fab5dADF33495d171`) with native `MNT`.
3. Deposit initial liquidity (e.g., `10,000 MAC` paired with `1,000 MNT`).
4. The Automated Market Maker (AMM) math will set the initial live price of `1 MAC = 0.1 MNT`. Arbitrage and trading swaps on the pool will then dictate the ticking price, which is parsed by the dashboard's Market Sentinel.

---

## 9. Forking, Setup & Deployment Guide

Follow these steps to fork the repository, compile smart contracts, and configure deployments:

### 1. Fork and Clone Repository
Fork the official repository on GitHub to your account, then clone the workspace:

    git clone https://github.com/<your_username>/mantle-agentic-core.git
    cd mantle-agentic-core

### 2. Deployed Contracts & Compiling (Hardhat)
Compile contract files and deploy them manually to Mantle Sepolia if needed:

    # Install Hardhat dependencies inside root or contract directory
    npm install
    
    # Compile contract files
    npx hardhat compile
    
    # Deploy Registry to Mantle Sepolia
    npx hardhat run scripts/deployCitadel.js --network mantleSepolia

### 3. Backend Setup (FastAPI Hub)
Configure environment variables, write your Supabase keys, and start the local API server:

    cd backend
    pip install -r requirements.txt
    
    # Configure variables inside .env
    cat <<EOT >> .env
    GROQ_API_KEY="gsk_..."
    GEMINI_API_KEY="AIzaSy..."
    PRIVATE_KEY="your_private_key"
    SUPABASE_KEY="your_supabase_secret_key"
    MANTLE_RPC_URL="https://rpc.sepolia.mantle.xyz"
    MAC_TOKEN_ADDRESS="0x69465a67c1C4860f89f2D80fab5dADF33495d171"
    TELEGRAM_BOT_TOKEN="your_telegram_bot_token"
    DISCORD_BOT_TOKEN="your_discord_bot_token"
    RENDER_EXTERNAL_URL="http://localhost:8000"
    EOT

    # Run backend locally
    uvicorn main:app --host 0.0.0.0 --port 8000 --reload

### 4. Frontend dApp Setup (Next.js)
Install Node modules and launch the Next.js development server:

    cd ../dashboard
    npm install
    
    # Configure your local AppKit Project ID inside .env.local
    echo "NEXT_PUBLIC_PROJECT_ID=df57076e4f6d827dda0ae1ae16a15623" > .env.local
    
    # Start dApp locally
    npm run dev

Open `http://localhost:3000` to test the terminal interface locally.