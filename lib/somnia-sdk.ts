import { SDK, SchemaEncoder, zeroBytes32 } from "@somnia-chain/streams"
import { createPublicClient, createWalletClient, http, custom, type PublicClient, type WalletClient, type Address } from "viem"
import { dreamChain } from "./dream-chain"

export const helloSchema = `string message, uint256 timestamp, address sender`

export function getPublicClient(): PublicClient {
  return createPublicClient({
    chain: dreamChain,
    transport: http()
  })
}

export async function getWalletClient(): Promise<WalletClient> {
  if (typeof window === 'undefined') {
    throw new Error('Wallet client can only be created in browser context')
  }
  
  if (!window.ethereum) {
    throw new Error('No wallet detected. Please install MetaMask or another Web3 wallet.')
  }

  // Get the connected accounts
  const accounts = await window.ethereum.request({ method: 'eth_accounts' }) as Address[]
  
  if (!accounts || accounts.length === 0) {
    throw new Error('No accounts connected. Please connect your wallet first.')
  }

  return createWalletClient({
    account: accounts[0],
    chain: dreamChain,
    transport: custom(window.ethereum)
  })
}

export async function createSDK(withWallet = false) {
  const publicClient = getPublicClient()
  
  if (withWallet) {
    const walletClient = await getWalletClient()
    return { sdk: new SDK({ public: publicClient, wallet: walletClient }), publicClient, walletClient }
  }
  
  return { sdk: new SDK({ public: publicClient }), publicClient }
}

export { SDK, SchemaEncoder, zeroBytes32 }

