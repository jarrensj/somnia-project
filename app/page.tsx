'use client'

import { useState } from 'react'
import { useBlockchain, type Transaction } from '@/lib/blockchain-hooks'
import { motion, AnimatePresence } from 'framer-motion'

function TransactionCard({ tx }: { tx: Transaction }) {
  const typeColors = {
    transfer: 'from-blue-100 to-blue-200 border-blue-300',
    contract: 'from-purple-100 to-purple-200 border-purple-300',
    other: 'from-gray-100 to-gray-200 border-gray-300'
  }

  const typeIcons = {
    transfer: '💸',
    contract: '📝',
    other: '🔄'
  }

  const shortenAddress = (addr: string | null) => {
    if (!addr) return 'Contract Creation'
    return `${addr.slice(0, 6)}…${addr.slice(-4)}`
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`bg-gradient-to-r ${typeColors[tx.type]} border rounded-lg p-3 backdrop-blur-sm overflow-hidden shadow-sm`}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-xl">{typeIcons[tx.type]}</span>
          <span className="text-xs font-mono text-gray-600">
            {shortenAddress(tx.hash)}
          </span>
        </div>
        <span className="text-xs text-gray-600">
          {new Date(tx.timestamp).toLocaleTimeString()}
        </span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className="text-gray-600">From:</span>
          <code className="text-green-700 font-mono text-xs">{shortenAddress(tx.from)}</code>
        </div>
        <span className="text-gray-600">→</span>
        <div className="flex items-center gap-2">
          <span className="text-gray-600">To:</span>
          <code className="text-blue-700 font-mono text-xs">{shortenAddress(tx.to)}</code>
        </div>
      </div>
      {parseFloat(tx.value) > 0 && (
        <div className="mt-2 text-right">
          <span className="text-amber-600 font-semibold">{parseFloat(tx.value).toFixed(4)} STT</span>
        </div>
      )}
    </motion.div>
  )
}

export default function Home() {
  const [isListening, setIsListening] = useState(false)
  const { transactions, stats, isConnected, error, network: networkInfo } = useBlockchain('testnet', isListening)

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
            
            <div className="flex justify-center">
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
              {transactions.length === 0 ? (
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
                transactions.map((tx) => (
                  <TransactionCard key={tx.hash} tx={tx} />
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}
