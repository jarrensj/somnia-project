'use client'

import { useState } from 'react'
import { useBlockchain, type Transaction } from '@/lib/blockchain-hooks'
import { useNotifications } from '@/lib/use-notifications'
import { motion, AnimatePresence } from 'framer-motion'

function TransactionCard({ tx, explorerUrl, networkType }: { tx: Transaction; explorerUrl: string; networkType: 'testnet' | 'mainnet' }) {
  const typeColors = {
    transfer: 'from-blue-100 to-blue-200 border-blue-300',
    contract: 'from-purple-100 to-purple-200 border-purple-300',
    other: 'from-gray-100 to-gray-200 border-gray-300'
  }

  const typeIcons = {
    transfer: '📤',
    contract: '📄',
    other: '⚡'
  }

  const typeLabels = {
    transfer: 'Transfer',
    contract: 'Contract Creation',
    other: 'Contract Interaction'
  }

  const shortenAddress = (addr: string | null) => {
    if (!addr) return 'Contract Creation'
    return `${addr.slice(0, 6)}…${addr.slice(-4)}`
  }

  const formatSTT = (value: string) => {
    const numValue = parseFloat(value)
    if (numValue === 0) return '0.0000'
    if (numValue < 0.0001) {
      // Show more decimals for very small values
      return numValue.toFixed(8)
    }
    return numValue.toFixed(4)
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`bg-gradient-to-r ${typeColors[tx.type]} border rounded-lg p-3 backdrop-blur-sm overflow-hidden shadow-sm`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{typeIcons[tx.type]}</span>
          <span className="text-sm font-semibold text-gray-800">{typeLabels[tx.type]}</span>
        </div>
        <span className="text-xs text-gray-500">
          {new Date(tx.timestamp).toLocaleTimeString()}
        </span>
      </div>
      
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-medium min-w-[90px]">TX Hash:</span>
          <code className="text-xs font-mono text-gray-700">{shortenAddress(tx.hash)}</code>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-medium min-w-[90px]">From Wallet:</span>
          <code className="text-xs font-mono text-green-700">{shortenAddress(tx.from)}</code>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-medium min-w-[90px]">
            {tx.type === 'transfer' ? 'To Wallet:' : tx.type === 'contract' ? 'Deploying:' : 'Contract:'}
          </span>
          <code className="text-xs font-mono text-blue-700">{shortenAddress(tx.to)}</code>
        </div>
        
        {parseFloat(tx.value) > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium min-w-[90px]">Amount:</span>
            <span className="text-sm text-amber-600 font-semibold">{formatSTT(tx.value)} STT</span>
          </div>
        )}
        
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-300/50">
          <a
            href={`${explorerUrl}/tx/${tx.hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium flex items-center gap-1"
          >
            🔍 View on {networkType === 'testnet' ? 'Shannon Explorer' : 'Somnia Explorer'}
            <span className="text-[10px]">↗</span>
          </a>
        </div>
      </div>
    </motion.div>
  )
}

export default function Home() {
  const [isListening, setIsListening] = useState(false)
  const [network, setNetwork] = useState<'testnet' | 'mainnet'>('mainnet')
  const [isMuted, setIsMuted] = useState(false)
  const [showOnlySTTTransfers, setShowOnlySTTTransfers] = useState(true)
  const [hideZeroSTT, setHideZeroSTT] = useState(true)
  const { transactions, stats, isConnected, error, network: networkInfo } = useBlockchain(network, isListening)
  const { toggleMute } = useNotifications()

  // Filter transactions based on the checkboxes
  let filteredTransactions = transactions
  
  if (showOnlySTTTransfers) {
    filteredTransactions = filteredTransactions.filter(tx => tx.type === 'transfer')
  }
  
  if (hideZeroSTT) {
    filteredTransactions = filteredTransactions.filter(tx => {
      const value = parseFloat(tx.value)
      return !isNaN(value) && value >= 0.0005
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-100 via-gray-100 to-slate-100 text-gray-900">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
          </div>

      <div className="relative z-10 p-4 md:p-6">
        {/* Live Transactions Feed */}
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col gap-3 mb-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Live Transactions</h2>
              <div className="text-lg font-semibold text-purple-600">
                {stats.totalTransactions.toLocaleString()} <span className="text-sm text-gray-600">total</span>
              </div>
            </div>

            {/* Network Selector */}
            <div className="flex justify-center">
              <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full p-1 shadow-md inline-flex">
                <button
                  onClick={() => {
                    if (isListening) setIsListening(false)
                    setNetwork('testnet')
                  }}
                  className={`px-6 py-2 rounded-full font-semibold transition-all text-sm ${
                    network === 'testnet'
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  🧪 Testnet
                </button>
                <button
                  onClick={() => {
                    if (isListening) setIsListening(false)
                    setNetwork('mainnet')
                  }}
                  className={`px-6 py-2 rounded-full font-semibold transition-all text-sm ${
                    network === 'mainnet'
                      ? 'bg-purple-500 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  🚀 Mainnet
                </button>
              </div>
            </div>

            {/* Transaction Filters */}
            <div className="flex justify-center flex-wrap gap-3">
              <label className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full px-4 py-2 shadow-md cursor-pointer hover:bg-white/90 transition-all">
                <input
                  type="checkbox"
                  checked={showOnlySTTTransfers}
                  onChange={(e) => setShowOnlySTTTransfers(e.target.checked)}
                  className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2 cursor-pointer"
                />
                <span className="text-sm font-semibold text-gray-700">Show only STT Transfers</span>
              </label>
              
              <label className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full px-4 py-2 shadow-md cursor-pointer hover:bg-white/90 transition-all">
                <input
                  type="checkbox"
                  checked={hideZeroSTT}
                  onChange={(e) => setHideZeroSTT(e.target.checked)}
                  className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2 cursor-pointer"
                />
                <span className="text-sm font-semibold text-gray-700">Hide all STT transactions that are under .0005</span>
              </label>
            </div>
            
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setIsListening(!isListening)}
                disabled={!isConnected}
                className={`px-8 py-3 rounded-full font-semibold transition-all shadow-lg text-base ${
                  isListening
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-green-500 hover:bg-green-600 text-white disabled:bg-gray-300 disabled:cursor-not-allowed'
                }`}
              >
                {isListening ? '⏸️ Stop Listening' : '▶️ Start Listening'}
              </button>
              
              <button
                onClick={() => {
                  const newMutedState = toggleMute()
                  setIsMuted(newMutedState)
                }}
                className={`px-6 py-3 rounded-full font-semibold transition-all shadow-lg text-base ${
                  isMuted
                    ? 'bg-gray-400 hover:bg-gray-500 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {isMuted ? '🔇 Unmute' : '🔊 Mute'}
              </button>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-3">
              <div className="flex items-center gap-2 bg-white/60 px-3 py-1.5 rounded-full backdrop-blur-sm border border-gray-200 shadow-sm">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : error ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'}`}></div>
                <span className="text-xs text-gray-700">{isConnected ? 'Connected' : error ? 'Disconnected' : 'Connecting…'}</span>
              </div>
              
              <p className="text-sm text-gray-700 font-medium">
                {networkInfo.name} • {networkInfo.symbol}
              </p>
            </div>
        </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-100 border border-red-300 rounded-lg p-4 mb-4 shadow-sm"
            >
              <div className="flex items-center gap-2">
                <span className="text-red-600">⚠️</span>
                <p className="text-sm text-red-700">{error}</p>
          </div>
            </motion.div>
          )}

          <div className="max-h-[calc(100vh-220px)] overflow-y-auto space-y-3 pr-2">
            <AnimatePresence mode="popLayout">
              {filteredTransactions.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="text-center py-12 text-gray-600"
                >
                  <div className="text-4xl mb-3">{isListening ? '⏳' : '▶️'}</div>
                  <p>{isListening ? 'Waiting for transactions…' : 'Click "Start Listening" to begin'}</p>
                  <p className="text-sm mt-2">{isListening ? 'Listening to real-time blockchain activity' : 'Press the button above to start monitoring transactions'}</p>
                </motion.div>
              ) : (
                filteredTransactions.map((tx) => (
                  <TransactionCard key={tx.hash} tx={tx} explorerUrl={networkInfo.explorerUrl} networkType={network} />
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}
