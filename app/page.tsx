'use client'

import { useEffect, useState } from 'react'
import { SchemaEncoder, zeroBytes32, helloSchema, createSDK, getWalletClient } from '@/lib/somnia-sdk'
import { toHex, type Hex } from 'viem'

interface Message {
  id: string
  message: string
  timestamp: string
  sender: string
}

export default function Home() {
  const [schemaId, setSchemaId] = useState<Hex | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isPublishing, setIsPublishing] = useState(false)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [publishCount, setPublishCount] = useState(0)
  const [hasPublishedBefore, setHasPublishedBefore] = useState(false)

  // Initialize schema and check if wallet is already connected
  useEffect(() => {
    async function initialize() {
      try {
        // Compute schema ID
        const { sdk } = await createSDK(false)
        const id = await sdk.streams.computeSchemaId(helloSchema)
        console.log('Schema ID:', id)
        setSchemaId(id)

        // Check if wallet is already connected
        if (window.ethereum) {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' }) as string[]
          if (accounts && accounts.length > 0) {
            setWalletAddress(accounts[0])
            console.log('Wallet already connected:', accounts[0])
          }
        }
      } catch (err) {
        console.error('Error initializing:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      }
    }

    initialize()
  }, [])

  // Connect wallet
  async function connectWallet() {
    try {
      setError(null)
      if (!window.ethereum) {
        throw new Error('No wallet detected')
      }
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' }) as string[]
      if (accounts && accounts.length > 0) {
        setWalletAddress(accounts[0])
        console.log('Connected wallet:', accounts[0])
        
        // Test wallet client creation
        await getWalletClient()
        console.log('Wallet client ready')
      } else {
        throw new Error('No accounts found')
      }
    } catch (err) {
      console.error('Error connecting wallet:', err)
      setError(err instanceof Error ? err.message : 'Failed to connect wallet')
    }
  }

  // Register schema
  async function registerSchema() {
    if (!walletAddress) {
      setError('Please connect wallet first')
      return
    }

    try {
      setError(null)
      const { sdk, publicClient } = await createSDK(true)

      const ignoreAlreadyRegistered = true
      
      const txHash = await sdk.streams.registerDataSchemas(
        [
          {
            id: toHex('hello_world', { size: 32 }),
            schema: helloSchema,
            parentSchemaId: zeroBytes32 as Hex
          },
        ],
        ignoreAlreadyRegistered
      )

      if (txHash && publicClient && typeof txHash === 'string') {
        // Wait for transaction
        await publicClient.waitForTransactionReceipt({ hash: txHash as Hex })
        console.log(`✅ Schema registered, Tx: ${txHash}`)
        alert(`Schema registered! Tx: ${txHash}`)
      } else {
        console.log('ℹ️ Schema already registered')
        alert('Schema already registered')
      }
    } catch (err) {
      if (String(err).includes('SchemaAlreadyRegistered')) {
        console.log('⚠️ Schema already registered. Continuing...')
        alert('Schema already registered')
      } else {
        console.error('Error registering schema:', err)
        setError(err instanceof Error ? err.message : 'Failed to register schema')
      }
    }
  }

  // Publish a message
  async function publishMessage() {
    if (!walletAddress || !schemaId) {
      setError('Please connect wallet and wait for schema initialization')
      return
    }

    try {
      setError(null)
      setIsPublishing(true)
      
      const { sdk, walletClient } = await createSDK(true)
      if (!walletClient?.account) {
        throw new Error('Wallet not connected')
      }
      
      const encoder = new SchemaEncoder(helloSchema)
      
      const count = publishCount + 1
      setPublishCount(count)

      const data = encoder.encodeData([
        { name: 'message', value: `Hello World #${count}`, type: 'string' },
        { name: 'timestamp', value: BigInt(Math.floor(Date.now() / 1000)), type: 'uint256' },
        { name: 'sender', value: walletClient.account.address, type: 'address' },
      ])

      const dataStreams = [{ 
        id: toHex(`hello-${count}`, { size: 32 }), 
        schemaId: schemaId as Hex, 
        data 
      }]
      
      const tx = await sdk.streams.set(dataStreams)
      console.log(`✅ Published: Hello World #${count} (Tx: ${tx})`)
      
      // Mark that we've published at least once
      setHasPublishedBefore(true)
      
      // Refresh messages after publishing
      setTimeout(() => fetchMessages(), 1000)
    } catch (err) {
      console.error('Error publishing message:', err)
      setError(err instanceof Error ? err.message : 'Failed to publish message')
    } finally {
      setIsPublishing(false)
    }
  }

  // Fetch all messages for a publisher
  async function fetchMessages() {
    if (!schemaId || !walletAddress) return
    
    // Don't try to fetch if we haven't published anything yet (prevents NoData error)
    if (!hasPublishedBefore) {
      console.log('No messages to fetch yet - publish your first message!')
      return
    }

    try {
      const { sdk } = await createSDK(false)
      const allData = await sdk.streams.getAllPublisherDataForSchema(schemaId as Hex, walletAddress as Hex)
      
      if (!allData) return
      
      const decodedMessages: Message[] = []
      
      for (const dataItem of allData) {
        let message = "", timestamp = "", sender = ""
        
        for (const field of dataItem) {
          if (typeof field === 'string') continue
          
          const val = field.value?.value ?? field.value
          if (field.name === "message") message = String(val)
          if (field.name === "timestamp") timestamp = String(val)
          if (field.name === "sender") sender = String(val)
        }

        const id = `${timestamp}-${message}`
        decodedMessages.push({ id, message, timestamp, sender })
      }

      setMessages(decodedMessages.reverse()) // Show newest first
    } catch (err) {
      // Handle NoData error gracefully - it just means no messages have been published yet
      const errorStr = String(err)
      if (errorStr.includes('NoData')) {
        console.log('No messages published yet')
        setMessages([])
        setHasPublishedBefore(false) // Reset flag
      } else {
        console.error('Error fetching messages:', err)
      }
    }
  }

  // Auto-refresh messages every 3 seconds
  useEffect(() => {
    if (!schemaId || !walletAddress) return

    fetchMessages()
    const interval = setInterval(fetchMessages, 3000)
    return () => clearInterval(interval)
  }, [schemaId, walletAddress])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Somnia Data Streams</h1>
        <p className="text-gray-400 mb-8">Hello World Publisher & Subscriber</p>

        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Schema Info */}
        <div className="bg-gray-800/50 rounded-lg p-6 mb-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-3">Schema Information</h2>
          {schemaId ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-400">Schema:</p>
              <code className="block bg-gray-900 p-3 rounded text-sm text-green-400">
                {helloSchema}
              </code>
              <p className="text-sm text-gray-400 mt-3">Schema ID:</p>
              <code className="block bg-gray-900 p-3 rounded text-xs text-blue-400 break-all">
                {schemaId}
              </code>
            </div>
          ) : (
            <p className="text-gray-400">Loading schema...</p>
          )}
        </div>

        {/* Wallet Connection */}
        <div className="bg-gray-800/50 rounded-lg p-6 mb-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-3">Wallet</h2>
          {!walletAddress ? (
            <button
              onClick={connectWallet}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold transition"
            >
              Connect Wallet
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-green-400">✓ Connected</p>
              <code className="block bg-gray-900 p-3 rounded text-sm text-gray-300">
                {walletAddress}
              </code>
              <button
                onClick={registerSchema}
                className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-semibold transition"
              >
                Register Schema
              </button>
            </div>
          )}
        </div>

        {/* Publisher */}
        {walletAddress && (
          <div className="bg-gray-800/50 rounded-lg p-6 mb-6 border border-gray-700">
            <h2 className="text-xl font-semibold mb-3">Publisher</h2>
            <button
              onClick={publishMessage}
              disabled={isPublishing || !schemaId}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-semibold transition"
            >
              {isPublishing ? 'Publishing...' : 'Publish "Hello World" Message'}
            </button>
            <p className="text-sm text-gray-400 mt-3">
              Messages published: {publishCount}
            </p>
          </div>
        )}

        {/* Subscriber - Messages List */}
        {walletAddress && (
          <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-semibold mb-3">Subscriber (Your Messages)</h2>
            <p className="text-sm text-gray-400 mb-4">Auto-refreshing every 3 seconds...</p>
            
            {messages.length === 0 ? (
              <p className="text-gray-500 italic">No messages yet. Publish your first message!</p>
            ) : (
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div key={msg.id} className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                    <p className="text-green-400 font-semibold mb-2">{msg.message}</p>
                    <div className="text-sm text-gray-400 space-y-1">
                      <p>From: <code className="text-gray-300">{msg.sender}</code></p>
                      <p>Time: {new Date(Number(msg.timestamp) * 1000).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-blue-900/20 border border-blue-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3">📖 How to Use</h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-300">
            <li>Connect your MetaMask wallet to Somnia Dream testnet</li>
            <li>Click "Register Schema" (one-time setup)</li>
            <li>Click "Publish Hello World Message" to send messages on-chain</li>
            <li>Watch your messages appear in real-time below</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
