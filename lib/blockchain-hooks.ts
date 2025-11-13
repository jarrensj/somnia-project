'use client'

import { useEffect, useState, useRef } from 'react'
import { ethers } from 'ethers'
import { useNotifications } from './use-notifications'

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
    symbol: 'STT',
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
}

export interface NetworkStats {
  currentBlock: number
  tps: number
  totalTransactions: number
}

export function useBlockchain(network: NetworkType, isListening: boolean) {
  const { playNotification } = useNotifications()
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
        let soundCount = 0

        if (block.transactions && Array.isArray(block.transactions)) {
          for (const txHash of block.transactions.slice(0, 10)) {
            try {
              if (typeof txHash === 'string') {
                const tx = await provider.getTransaction(txHash)
                if (tx) {
                  let txType: 'transfer' | 'contract' | 'other' = 'other'
                  if (tx.to === null) {
                    txType = 'contract'
                  } else if (tx.data === '0x' || tx.data === '0x0') {
                    txType = 'transfer'
                  }

                  const txData = {
                    hash: tx.hash,
                    from: tx.from,
                    to: tx.to,
                    value: ethers.formatEther(tx.value),
                    timestamp: Date.now(),
                    type: txType
                  }
                  
                  newTxs.push(txData)
                  
                  // Count transactions that should trigger sound
                  if (txType === 'transfer' && parseFloat(txData.value) > 1) {
                    soundCount++
                  }
                }
              }
            } catch (err) {
              console.error('Error fetching transaction:', err)
            }
          }
        }
        
        // Play staggered sounds for each qualifying transaction
        if (soundCount > 0) {
          playNotification('transfer', soundCount, 600)
        }

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

        // Update transactions list (keep last 50)
        setTransactions(prev => [...newTxs, ...prev].slice(0, 50))
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
  }, [provider, isListening])

  return {
    transactions,
    stats,
    isConnected,
    error,
    network: NETWORKS[network]
  }
}

