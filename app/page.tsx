'use client'

import { useState } from 'react'
import { useBlockchain, type Transaction } from '@/lib/blockchain-hooks'
import { useNotifications } from '@/lib/use-notifications'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, FileText, Zap, ExternalLink, Rocket, FlaskConical, Pause, Play, VolumeX, Volume2, AlertTriangle, Radio } from 'lucide-react'

function TransactionCard({ tx, explorerUrl, networkType }: { tx: Transaction; explorerUrl: string; networkType: 'testnet' | 'mainnet' }) {
  const typeColors = {
    transfer: 'from-blue-100 to-blue-200 border-blue-300',
    contract: 'from-purple-100 to-purple-200 border-purple-300',
    other: 'from-gray-100 to-gray-200 border-gray-300'
  }

  const TypeIcon = ({ type }: { type: 'transfer' | 'contract' | 'other' }) => {
    const iconProps = { size: 20, className: "text-gray-700" }
    if (type === 'transfer') return <Send {...iconProps} />
    if (type === 'contract') return <FileText {...iconProps} />
    return <Zap {...iconProps} />
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
          <TypeIcon type={tx.type} />
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
            <span className="text-sm text-amber-600 font-semibold">{parseFloat(tx.value).toFixed(4)} STT</span>
          </div>
        )}
        
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-300/50">
          <a
            href={`${explorerUrl}/tx/${tx.hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium flex items-center gap-1"
          >
            <ExternalLink size={14} />
            View on {networkType === 'testnet' ? 'Shannon Explorer' : 'Somnia Explorer'}
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
  const { transactions, stats, isConnected, error, network: networkInfo } = useBlockchain(network, isListening)
  const { toggleMute } = useNotifications()

  // Filter transactions based on the checkbox
  const filteredTransactions = showOnlySTTTransfers
    ? transactions.filter(tx => tx.type === 'transfer' && parseFloat(tx.value) > 0)
    : transactions

  return (
    <div className="min-h-screen">
      <div className="p-4 md:p-6">
        {/* Live Transactions Feed */}
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col gap-3 mb-4">
            <div className="flex items-center justify-end">
              <div className="text-lg font-semibold">
                {stats.totalTransactions.toLocaleString()} <span className="text-sm">total</span>
              </div>
            </div>

            {/* Controls Row */}
            <div className="flex justify-center items-center gap-3 flex-wrap">
              {/* Network Selector */}
              <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full p-1 shadow-md inline-flex">
                <button
                  onClick={() => {
                    if (isListening) setIsListening(false)
                    setNetwork('mainnet')
                  }}
                  className={`px-4 py-2 rounded-full font-semibold transition-all text-sm flex items-center gap-2 ${
                    network === 'mainnet'
                      ? 'bg-purple-500 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Rocket size={16} />
                  Mainnet
                </button>
                <button
                  onClick={() => {
                    if (isListening) setIsListening(false)
                    setNetwork('testnet')
                  }}
                  className={`px-4 py-2 rounded-full font-semibold transition-all text-sm flex items-center gap-2 ${
                    network === 'testnet'
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <FlaskConical size={16} />
                  Testnet
                </button>
              </div>

              {/* STT Transfer Filter */}
              <label className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full px-4 py-2 shadow-md cursor-pointer hover:bg-white/90 transition-all">
                <input
                  type="checkbox"
                  checked={showOnlySTTTransfers}
                  onChange={(e) => setShowOnlySTTTransfers(e.target.checked)}
                  className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2 cursor-pointer"
                />
                <span className="text-sm font-semibold text-gray-700">Show only STT Transfers</span>
              </label>
              
              {/* Start/Stop Listening Button */}
              <button
                onClick={() => setIsListening(!isListening)}
                disabled={!isConnected}
                className={`px-6 py-2 rounded-full font-semibold transition-all shadow-lg text-sm flex items-center gap-2 ${
                  isListening
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-green-500 hover:bg-green-600 text-white disabled:bg-gray-300 disabled:cursor-not-allowed'
                }`}
              >
                {isListening ? (
                  <>
                    <Pause size={16} />
                    Stop Listening
                  </>
                ) : (
                  <>
                    <Play size={16} />
                    Start Listening
                  </>
                )}
              </button>
              
              {/* Mute Button */}
              <button
                onClick={() => {
                  const newMutedState = toggleMute()
                  setIsMuted(newMutedState)
                }}
                className={`px-5 py-2 rounded-full font-semibold transition-all shadow-lg text-sm flex items-center gap-2 ${
                  isMuted
                    ? 'bg-gray-400 hover:bg-gray-500 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {isMuted ? (
                  <>
                    <VolumeX size={16} />
                    Unmute
                  </>
                ) : (
                  <>
                    <Volume2 size={16} />
                    Mute
                  </>
                )}
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
                <AlertTriangle size={18} className="text-red-600" />
                <p className="text-sm text-red-700">{error}</p>
          </div>
            </motion.div>
          )}

          <div className="max-h-[calc(100vh-220px)] overflow-y-auto space-y-3 pr-2">
            <AnimatePresence mode="popLayout">
              {filteredTransactions.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="text-center py-16"
                >
                  {isListening ? (
                    <div className="flex flex-col items-center gap-6">
                      <div className="relative">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          className="w-20 h-20 border-4 border-blue-200 border-t-blue-500 rounded-full"
                        />
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                          className="absolute inset-0 flex items-center justify-center"
                        >
                          <Radio size={32} className="text-blue-600" />
                        </motion.div>
                      </div>
                      <div>
                        <p className="text-lg font-semibold mb-2">Listening for transactions...</p>
                        <p className="text-sm text-gray-500">Real-time blockchain monitoring active</p>
                      </div>
                    </div>
                  ) : (
                    <motion.button
                      onClick={() => setIsListening(true)}
                      disabled={!isConnected}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex flex-col items-center gap-4 mx-auto p-8 rounded-2xl bg-white border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:border-gray-300 disabled:hover:bg-white"
                    >
                      <Play size={48} className="text-blue-600" />
                      <div>
                        <p className="text-lg font-semibold mb-1">Click to Start Listening</p>
                        <p className="text-sm text-gray-500">Monitor live blockchain transactions</p>
                      </div>
                    </motion.button>
                  )}
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
