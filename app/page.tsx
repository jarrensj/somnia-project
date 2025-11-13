'use client'

import { useState } from 'react'
import { useBlockchain, type Transaction } from '@/lib/blockchain-hooks'
import { useNotifications } from '@/lib/use-notifications'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, FileText, Zap, ExternalLink, Rocket, FlaskConical, Pause, Play, VolumeX, Volume2, AlertTriangle, Radio } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'

function TransactionCard({ tx, explorerUrl, networkType }: { tx: Transaction; explorerUrl: string; networkType: 'testnet' | 'mainnet' }) {
  const typeVariants = {
    transfer: { variant: 'default' as const, icon: Send },
    contract: { variant: 'secondary' as const, icon: FileText },
    other: { variant: 'outline' as const, icon: Zap }
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

  const TypeIcon = typeVariants[tx.type].icon

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant={typeVariants[tx.type].variant} className="gap-1.5">
                <TypeIcon size={14} />
                {typeLabels[tx.type]}
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground">
              {new Date(tx.timestamp).toLocaleTimeString()}
            </span>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium min-w-[90px]">TX Hash:</span>
            <code className="text-xs font-mono">{shortenAddress(tx.hash)}</code>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium min-w-[90px]">From Wallet:</span>
            <code className="text-xs font-mono text-green-600 dark:text-green-400">{shortenAddress(tx.from)}</code>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium min-w-[90px]">
              {tx.type === 'transfer' ? 'To Wallet:' : tx.type === 'contract' ? 'Deploying:' : 'Contract:'}
            </span>
            <code className="text-xs font-mono text-blue-600 dark:text-blue-400">{shortenAddress(tx.to)}</code>
          </div>
          
          {parseFloat(tx.value) > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium min-w-[90px]">Amount:</span>
              <Badge variant="outline" className="text-amber-600 dark:text-amber-400 font-semibold">
                {formatSTT(tx.value)} STT
              </Badge>
            </div>
          )}
          
          <Separator className="my-2" />
          
          <a
            href={`${explorerUrl}/tx/${tx.hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline font-medium flex items-center gap-1.5"
          >
            <ExternalLink size={14} />
            View on {networkType === 'testnet' ? 'Shannon Explorer' : 'Somnia Explorer'}
          </a>
        </CardContent>
      </Card>
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
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
              <div className="inline-flex rounded-lg border bg-card p-1 shadow-sm">
                <Button
                  variant={network === 'mainnet' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => {
                    if (isListening) setIsListening(false)
                    setNetwork('mainnet')
                  }}
                  className="gap-2"
                >
                  <Rocket size={16} />
                  Mainnet
                </Button>
                <Button
                  variant={network === 'testnet' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => {
                    if (isListening) setIsListening(false)
                    setNetwork('testnet')
                  }}
                  className="gap-2"
                >
                  <FlaskConical size={16} />
                  Testnet
                </Button>
              </div>

              {/* STT Transfer Filter */}
              <label className="flex items-center gap-2 bg-card border rounded-lg px-4 py-2 shadow-sm cursor-pointer hover:bg-accent/50 transition-all">
                <Switch
                  checked={showOnlySTTTransfers}
                  onCheckedChange={setShowOnlySTTTransfers}
                />
                <span className="text-sm font-medium">Show only STT Transfers</span>
              </label>
              
              {/* Hide Zero STT Filter */}
              <label className="flex items-center gap-2 bg-card border rounded-lg px-4 py-2 shadow-sm cursor-pointer hover:bg-accent/50 transition-all">
                <Switch
                  checked={hideZeroSTT}
                  onCheckedChange={setHideZeroSTT}
                />
                <span className="text-sm font-medium">Hide STT under 0.0005</span>
              </label>
              
              {/* Start/Stop Listening Button */}
              <Button
                onClick={() => setIsListening(!isListening)}
                disabled={!isConnected}
                variant={isListening ? 'destructive' : 'default'}
                size="default"
                className="shadow-lg"
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
              </Button>
              
              {/* Mute Button */}
              <Button
                onClick={() => {
                  const newMutedState = toggleMute()
                  setIsMuted(newMutedState)
                }}
                variant={isMuted ? 'secondary' : 'default'}
                size="default"
                className="shadow-lg"
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
              </Button>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Badge variant={isConnected ? 'default' : error ? 'destructive' : 'secondary'} className="gap-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : error ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'}`}></div>
                {isConnected ? 'Connected' : error ? 'Disconnected' : 'Connecting…'}
              </Badge>
              
              <Badge variant="outline" className="font-medium">
                {networkInfo.name} • {networkInfo.symbol}
              </Badge>
            </div>
        </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle size={18} />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
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
                          className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full"
                        />
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                          className="absolute inset-0 flex items-center justify-center"
                        >
                          <Radio size={32} className="text-primary" />
                        </motion.div>
                      </div>
                      <div>
                        <p className="text-lg font-semibold mb-2">Listening for transactions...</p>
                        <p className="text-sm text-muted-foreground">Real-time blockchain monitoring active</p>
                      </div>
                    </div>
                  ) : (
                    <Card className="mx-auto max-w-md">
                      <CardContent className="pt-6">
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="flex flex-col items-center gap-4"
                        >
                          <Play size={48} className="text-primary" />
                          <div className="text-center">
                            <p className="text-lg font-semibold mb-2">Click to Start Listening</p>
                            <p className="text-sm text-muted-foreground mb-4">Monitor live blockchain transactions</p>
                            <Button 
                              onClick={() => setIsListening(true)}
                              disabled={!isConnected}
                              size="lg"
                            >
                              <Play size={20} />
                              Start Monitoring
                            </Button>
                          </div>
                        </motion.div>
                      </CardContent>
                    </Card>
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
