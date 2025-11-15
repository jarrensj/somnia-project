'use client'

import { useEffect, useState, useRef } from 'react'
import { ethers } from 'ethers'

export type NetworkType = 'testnet' | 'mainnet'

interface NetworkConfig {
  name: string
  rpcUrl: string
  chainId: number
  symbol: string
  explorerUrl: string
}

const NETWORKS: Record<NetworkType, NetworkConfig> = {
  testnet: {
    name: 'Somnia Dream Testnet',
    rpcUrl: 'https://dream-rpc.somnia.network',
    chainId: 50312,
    symbol: 'STT',
    explorerUrl: 'https://shannon-explorer.somnia.network'
  },
  mainnet: {
    name: 'Somnia Mainnet',
    rpcUrl: 'https://api.infra.mainnet.somnia.network/',
    chainId: 50311,
    symbol: 'SOMI',
    explorerUrl: 'https://explorer.somnia.network'
  }
}

export interface Transaction {
  hash: string
  from: string
  to: string | null
  value: string
  timestamp: number
  type: 'transfer' | 'contract' | 'other'
  soundDelay?: number // Delay in ms before sound plays
}

export interface NetworkStats {
  currentBlock: number
  tps: number
  totalTransactions: number
}

// ERC-20 Transfer event signature: Transfer(address,address,uint256)
const TRANSFER_EVENT_SIGNATURE = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'

// Helper function to check if transaction is an ERC-20 transfer to a specific token
function isERC20Transfer(tx: ethers.TransactionResponse, tokenAddress: string): { isTransfer: boolean; amount: string } {
  // Check if tx.to matches the token address and if there's data
  if (tx.to?.toLowerCase() !== tokenAddress.toLowerCase() || !tx.data) {
    return { isTransfer: false, amount: '0' }
  }
  
  // Check for transfer(address,uint256) function signature: 0xa9059cbb
  if (tx.data.startsWith('0xa9059cbb') && tx.data.length >= 138) {
    try {
      // Extract amount from the data (last 32 bytes)
      const amountHex = '0x' + tx.data.slice(74, 138)
      const amount = ethers.formatEther(amountHex)
      return { isTransfer: true, amount }
    } catch {
      return { isTransfer: false, amount: '0' }
    }
  }
  
  return { isTransfer: false, amount: '0' }
}

export function useBlockchain(
  network: NetworkType, 
  isListening: boolean,
  playTransferSound: (amount: number) => void,
  playCustomSound: (frequency: number, duration: number, volume: number, waveType: OscillatorType) => void,
  showOnlySTTTransfers: boolean,
  hideZeroSTT: boolean,
  customTokenAddress?: string
) {
  const [provider, setProvider] = useState<ethers.JsonRpcProvider | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [stats, setStats] = useState<NetworkStats>({
    currentBlock: 0,
    tps: 0,
    totalTransactions: 0
  })
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const blockTimesRef = useRef<number[]>([])
  const txCountRef = useRef<number[]>([])
  const lastUpdateRef = useRef<number>(Date.now())

  // Initialize provider
  useEffect(() => {
    const config = NETWORKS[network]
    const newProvider = new ethers.JsonRpcProvider(config.rpcUrl)
    
    // Test connection
    setIsConnected(false)
    setError(null)
    
    newProvider.getBlockNumber()
      .then(() => {
        setProvider(newProvider)
        setIsConnected(true)
        setError(null)
      })
      .catch((err) => {
        console.error(`Failed to connect to ${config.name}:`, err)
        setIsConnected(false)
        setError(`Unable to connect to ${config.name}. The network may not be available yet.`)
      })
    
    // Reset state when network changes
    setTransactions([])
    setStats({
      currentBlock: 0,
      tps: 0,
      totalTransactions: 0
    })
    blockTimesRef.current = []
    txCountRef.current = []
    
    return () => {
      newProvider.removeAllListeners()
    }
  }, [network])

  // Listen for new blocks
  useEffect(() => {
    if (!provider || !isListening) return

    const handleBlock = async (blockNumber: number) => {
      try {
        const block = await provider.getBlock(blockNumber, true)
        if (!block) return

        const now = Date.now()
        const blockTime = now - lastUpdateRef.current
        lastUpdateRef.current = now

        // Track block times (keep last 10)
        blockTimesRef.current.push(blockTime)
        if (blockTimesRef.current.length > 10) {
          blockTimesRef.current.shift()
        }

        // Process transactions
        const newTxs: Transaction[] = []
        const transfersForSound: number[] = [] // Store transfer amounts for sound
        const transferIndexMap = new Map<string, number>() // Map tx hash to transfersForSound index
        const isMonitoringCustomToken = customTokenAddress && ethers.isAddress(customTokenAddress)
        const baseTimestamp = Date.now()
        let txIndex = 0

        if (block.transactions && Array.isArray(block.transactions)) {
          let txIndex = 0
          for (const txHash of block.transactions.slice(0, 10)) {
            try {
              if (typeof txHash === 'string') {
                const tx = await provider.getTransaction(txHash)
                if (tx) {
                  let txType: 'transfer' | 'contract' | 'other' = 'other'
                  let transferValue = '0'
                  let shouldInclude = false
                  
                  // If monitoring a custom token, check for ERC-20 transfers
                  if (isMonitoringCustomToken) {
                    const erc20Check = isERC20Transfer(tx, customTokenAddress)
                    if (erc20Check.isTransfer) {
                      txType = 'transfer'
                      transferValue = erc20Check.amount
                      shouldInclude = true
                    }
                  } else {
                    // Monitor native token transfers
                    if (tx.to === null) {
                      txType = 'contract'
                      transferValue = ethers.formatEther(tx.value)
                      shouldInclude = true
                    } else if (tx.data === '0x' || tx.data === '0x0') {
                      txType = 'transfer'
                      transferValue = ethers.formatEther(tx.value)
                      shouldInclude = true
                    } else {
                      txType = 'other'
                      transferValue = ethers.formatEther(tx.value)
                      shouldInclude = true
                    }
                  }

                  if (shouldInclude) {
                    const txData: Transaction = {
                      hash: tx.hash,
                      from: tx.from,
                      to: tx.to,
                      value: transferValue,
                      timestamp: baseTimestamp + txIndex, // Add index for sequential timestamps
                      type: txType,
                      soundDelay: 0 // Will be set later
                    }
                    
                    newTxs.push(txData)
                    txIndex++
                    
                    // Store transfer amounts for pitch-based sound and track index
                    if (txType === 'transfer' && parseFloat(txData.value) >= 0) {
                      transferIndexMap.set(tx.hash, transfersForSound.length)
                      transfersForSound.push(parseFloat(txData.value))
                    }
                  }
                }
              }
            } catch (err) {
              console.error('Error fetching transaction:', err)
            }
          }
        }
        
        // Calculate sound delays based on transfersForSound array index
        // This matches how sounds are actually played (forEach with index * 600)
        const filtersActive = showOnlySTTTransfers && hideZeroSTT
        
        newTxs.forEach((txData) => {
          const transferIndex = transferIndexMap.get(txData.hash)
          if (transferIndex !== undefined) {
            const amount = parseFloat(txData.value)
            const willPlaySound = (amount >= 0.0005) || (!filtersActive && amount > 0 && amount < 0.0005)
            
            // Only set delay if sound will actually play
            if (willPlaySound) {
              txData.soundDelay = transferIndex * 600
            }
          }
        })
        
        // Play pitch-scaled sounds for each qualifying transfer
        
        transfersForSound.forEach((amount, index) => {
          setTimeout(() => {
            if (amount > 0 && amount < 0.0005) {
              // Only play tiny transfer sounds when filters are OFF
              if (!filtersActive) {
                playCustomSound(200, 0.1, 0.04, 'sine') // Very low frequency, very short, very quiet
              }
            } else if (amount >= 0.0005) {
              // Play alert sounds for meaningful transfers (≥ 0.0005 STT)
              playTransferSound(amount)
            }
          }, index * 600) // Stagger sounds by 600ms
        })

        // Track transaction count for TPS calculation
        const txCount = Array.isArray(block.transactions) ? block.transactions.length : 0
        txCountRef.current.push(txCount)
        if (txCountRef.current.length > 10) {
          txCountRef.current.shift()
        }

        // Calculate TPS (transactions per second)
        const totalTxs = txCountRef.current.reduce((a, b) => a + b, 0)
        const totalTime = blockTimesRef.current.reduce((a, b) => a + b, 0) / 1000
        const tps = totalTime > 0 ? totalTxs / totalTime : 0

        // Update stats
        setStats(prev => ({
          currentBlock: blockNumber,
          tps: Math.round(tps * 10) / 10,
          totalTransactions: prev.totalTransactions + txCount
        }))

        // Update transactions list (keep all transactions, deduplicate by hash)
        // Reverse new transactions so newest (highest timestamp) appear at top
        setTransactions(prev => {
          const reversedNewTxs = [...newTxs].reverse()
          const combined = [...reversedNewTxs, ...prev]
          const seen = new Set<string>()
          return combined.filter(tx => {
            if (seen.has(tx.hash)) {
              return false
            }
            seen.add(tx.hash)
            return true
          })
        })
      } catch (err) {
        console.error('Error handling block:', err)
      }
    }

    provider.on('block', handleBlock)

    // Get initial block
    provider.getBlockNumber().then(handleBlock)

    return () => {
      provider.off('block', handleBlock)
    }
  }, [provider, isListening, showOnlySTTTransfers, hideZeroSTT, playTransferSound, playCustomSound, customTokenAddress])

  return {
    transactions,
    stats,
    isConnected,
    error,
    network: NETWORKS[network]
  }
}

