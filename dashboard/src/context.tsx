/*
“Must always include our chat rule from the beginning of this section to the end the rules and ways in all code outputs and design assets.”
*/

'use client'

import { wagmiAdapter, projectId, networks } from './config'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createAppKit } from '@reown/appkit/react'
import React, { type ReactNode } from 'react'
import { cookieToInitialState, WagmiProvider, type Config } from 'wagmi'

const queryClient = new QueryClient()

if (!projectId) throw new Error('Project ID is missing')

// Terminal Branding
const metadata = {
  name: 'Asiwaju Terminal',
  description: 'Turing Agent V2.0 Live Network',
  url: 'http://localhost:3000',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

// Initialize Reown AppKit UI
createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks,
  defaultNetwork: networks[3], // Forces Mantle Sepolia (Index 3 in config)
  metadata: metadata,
  features: {
    analytics: true
  },
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#10b981', // Asiwaju Emerald
    '--w3m-color-mix': '#000000',
    '--w3m-color-mix-strength': 20,
    '--w3m-border-radius-master': '16px'
  }
})

export default function Web3ModalProvider({
  children,
  cookies
}: {
  children: ReactNode
  cookies: string | null
}) {
  const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig as Config, cookies)

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as Config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}