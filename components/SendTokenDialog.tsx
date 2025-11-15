'use client'

import { useState } from 'react'
import { ethers } from 'ethers'
import { Send, Wallet, Loader2, ExternalLink } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'

interface SendTokenDialogProps {
  network: {
    name: string
    symbol: string
    chainId: number
    rpcUrl: string
    explorerUrl: string
  }
}

export function SendTokenDialog({ network }: SendTokenDialogProps) {
  const [open, setOpen] = useState(false)
  const [recipientAddress, setRecipientAddress] = useState('')
  const [amount, setAmount] = useState('')
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [walletBalance, setWalletBalance] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)

  const connectWallet = async () => {
    setIsConnecting(true)
    setError(null)
    
    try {
      // Check if MetaMask is installed and get the MetaMask provider specifically
      let ethereum = window.ethereum
      
      // If multiple wallets are installed, try to find MetaMask specifically
      if (window.ethereum?.providers) {
        const provider = window.ethereum.providers.find((p: any) => p.isMetaMask)
        if (provider) {
          ethereum = provider
        }
      }
      
      if (!ethereum) {
        throw new Error('MetaMask is not installed. Please install MetaMask to continue.')
      }
      
      // Check if this is actually MetaMask
      if (!ethereum.isMetaMask) {
        throw new Error('Please use MetaMask wallet for this transaction. If you have multiple wallets installed, please disable other wallet extensions temporarily.')
      }

      // Request account access - this will prompt MetaMask to open
      // and let you select which account to connect
      const accounts = await ethereum.request({ 
        method: 'eth_requestAccounts' 
      })
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please connect your wallet.')
      }

      const address = accounts[0]
      
      // Verify the address format
      if (!ethers.isAddress(address)) {
        throw new Error('Invalid wallet address received. Please try reconnecting.')
      }
      
      setWalletAddress(address)

      // Check if we need to switch networks
      const currentChainId = await ethereum.request({ 
        method: 'eth_chainId' 
      })
      
      const targetChainId = `0x${network.chainId.toString(16)}`
      
      if (currentChainId !== targetChainId) {
        try {
          // Try to switch to the network
          await ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: targetChainId }],
          })
        } catch (switchError: any) {
          // Network not added to MetaMask, let's add it
          if (switchError.code === 4902) {
            await ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: targetChainId,
                chainName: network.name,
                rpcUrls: [network.rpcUrl],
                nativeCurrency: {
                  name: network.symbol,
                  symbol: network.symbol,
                  decimals: 18
                }
              }],
            })
          } else {
            throw switchError
          }
        }
      }

      // Get balance using the specific ethereum provider
      const provider = new ethers.BrowserProvider(ethereum)
      const balance = await provider.getBalance(address)
      setWalletBalance(ethers.formatEther(balance))
      
    } catch (err: any) {
      console.error('Error connecting wallet:', err)
      setError(err.message || 'Failed to connect wallet')
      setWalletAddress(null)
    } finally {
      setIsConnecting(false)
    }
  }

  const refreshBalance = async () => {
    if (!walletAddress) return
    
    try {
      // Get the MetaMask provider
      let ethereum = window.ethereum
      if (window.ethereum?.providers) {
        const provider = window.ethereum.providers.find((p: any) => p.isMetaMask)
        if (provider) ethereum = provider
      }
      
      const provider = new ethers.BrowserProvider(ethereum!)
      const balance = await provider.getBalance(walletAddress)
      setWalletBalance(ethers.formatEther(balance))
    } catch (err) {
      console.error('Error refreshing balance:', err)
    }
  }

  const sendTransaction = async () => {
    if (!walletAddress) {
      setError('Please connect your wallet first')
      return
    }

    if (!recipientAddress || !ethers.isAddress(recipientAddress)) {
      setError('Please enter a valid recipient address')
      return
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount')
      return
    }

    setIsSending(true)
    setError(null)
    setSuccess(null)
    setTxHash(null)

    try {
      // Get the MetaMask provider
      let ethereum = window.ethereum
      if (window.ethereum?.providers) {
        const provider = window.ethereum.providers.find((p: any) => p.isMetaMask)
        if (provider) ethereum = provider
      }
      
      const provider = new ethers.BrowserProvider(ethereum!)
      
      // Verify we're on the correct network
      const currentNetwork = await provider.getNetwork()
      if (Number(currentNetwork.chainId) !== network.chainId) {
        throw new Error(`Please switch to ${network.name} (Chain ID: ${network.chainId}) in MetaMask`)
      }
      
      // Get fresh balance and verify sufficient funds
      const balance = await provider.getBalance(walletAddress)
      const balanceInEther = parseFloat(ethers.formatEther(balance))
      const amountToSend = parseFloat(amount)
      
      setWalletBalance(ethers.formatEther(balance))
      
      if (balanceInEther === 0) {
        throw new Error(`Your wallet has 0 ${network.symbol} on ${network.name}. Please fund your wallet first.`)
      }
      
      // Check if balance is sufficient (amount + estimated gas)
      // Estimate ~0.001 for gas (conservative estimate)
      const estimatedTotal = amountToSend + 0.001
      
      if (balanceInEther < estimatedTotal) {
        throw new Error(
          `Insufficient balance. You have ${balanceInEther.toFixed(6)} ${network.symbol} but need at least ${estimatedTotal.toFixed(6)} ${network.symbol} (including gas fees). Please reduce the amount or add more ${network.symbol} to your wallet.`
        )
      }
      
      const signer = await provider.getSigner()

      const tx = await signer.sendTransaction({
        to: recipientAddress,
        value: ethers.parseEther(amount)
      })

      setTxHash(tx.hash)
      setSuccess('Transaction sent! Waiting for confirmation...')
      
      // Wait for confirmation
      await tx.wait()
      
      setSuccess('Transaction confirmed!')
      
      // Update balance
      await refreshBalance()
      
      // Clear form
      setRecipientAddress('')
      setAmount('')
      
    } catch (err: any) {
      console.error('Error sending transaction:', err)
      
      // Parse common error messages
      let errorMessage = err.message || 'Failed to send transaction'
      
      if (errorMessage.includes('insufficient funds')) {
        errorMessage = `Insufficient funds. Your wallet doesn't have enough ${network.symbol} on ${network.name}. Please check your balance and network.`
      } else if (errorMessage.includes('user rejected')) {
        errorMessage = 'Transaction was rejected in MetaMask'
      }
      
      setError(errorMessage)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="default" className="gap-2 shadow-lg">
          <Send size={16} />
          Send {network.symbol}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Send {network.symbol}</DialogTitle>
          <DialogDescription>
            Send {network.symbol} tokens to another wallet on {network.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Wallet Connection */}
          {!walletAddress ? (
            <div className="space-y-3">
              <Alert>
                <Wallet className="h-4 w-4" />
                <AlertDescription>
                  Connect your wallet to send {network.symbol} tokens
                </AlertDescription>
              </Alert>
              <Button 
                onClick={connectWallet} 
                disabled={isConnecting}
                className="w-full"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wallet className="mr-2 h-4 w-4" />
                    Connect Wallet
                  </>
                )}
              </Button>
            </div>
          ) : (
            <>
              {/* Connected Wallet Info */}
              <div className="rounded-lg border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Connected Wallet</span>
                  <Badge variant="default" className="gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    MetaMask
                  </Badge>
                </div>
                <code className="text-xs block break-all bg-muted p-2 rounded">{walletAddress}</code>
                {walletBalance !== null && (
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-sm text-muted-foreground">Balance on {network.name}:</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold ${parseFloat(walletBalance) === 0 ? 'text-red-500' : ''}`}>
                        {parseFloat(walletBalance).toFixed(6)} {network.symbol}
                      </span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={refreshBalance}
                        className="h-6 px-2 text-xs"
                      >
                        Refresh
                      </Button>
                    </div>
                  </div>
                )}
                {parseFloat(walletBalance || '0') === 0 && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertDescription className="text-xs">
                      ⚠️ Your wallet has 0 {network.symbol} on {network.name}. Please fund your wallet before sending.
                    </AlertDescription>
                  </Alert>
                )}
                <Alert className="mt-2">
                  <AlertDescription className="text-xs">
                    Not your wallet? Click <strong>Disconnect</strong> below and reconnect with the correct account in MetaMask.
                  </AlertDescription>
                </Alert>
              </div>

              {/* Recipient Address */}
              <div className="space-y-2">
                <Label htmlFor="recipient">Recipient Address</Label>
                <Input
                  id="recipient"
                  placeholder="0x..."
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  disabled={isSending}
                />
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount">Amount ({network.symbol})</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.000001"
                  placeholder="0.0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={isSending}
                />
              </div>
            </>
          )}

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Message */}
          {success && (
            <Alert>
              <AlertDescription className="space-y-2">
                <div>{success}</div>
                {txHash && (
                  <a
                    href={`${network.explorerUrl}/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-medium flex items-center gap-1.5 text-sm"
                  >
                    View transaction
                    <ExternalLink size={14} />
                  </a>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          {walletAddress && (
            <>
              <Button 
                variant="outline" 
                onClick={() => {
                  setWalletAddress(null)
                  setWalletBalance(null)
                  setRecipientAddress('')
                  setAmount('')
                  setError(null)
                  setSuccess(null)
                  setTxHash(null)
                }}
                disabled={isSending}
              >
                Disconnect
              </Button>
              <Button 
                onClick={sendTransaction}
                disabled={isSending || !recipientAddress || !amount}
              >
                {isSending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Transaction
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

