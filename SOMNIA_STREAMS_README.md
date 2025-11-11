# Somnia Data Streams - Hello World Next.js App

A Next.js implementation of the [Somnia Data Streams Hello World example](https://docs.somnia.network/somnia-data-streams/getting-started/hello-world-app).

## What This App Does

This application demonstrates how to use **Somnia Data Streams** to:
- 📝 **Publish** "Hello World" messages on-chain
- 👁️ **Subscribe** and read messages in real-time
- 🔗 Work with blockchain data without building indexers

## Features

- ✅ Compute and display Schema ID
- ✅ Connect MetaMask wallet
- ✅ Register data schemas on Somnia Dream testnet
- ✅ Publish messages to the blockchain
- ✅ Auto-refresh and display messages every 3 seconds
- ✅ Beautiful, modern UI with Tailwind CSS

## Prerequisites

Before running this app, make sure you have:

1. **Node.js 18+** installed
2. **MetaMask** (or another Web3 wallet) browser extension
3. **Somnia Dream Testnet** configured in MetaMask:
   - Network Name: `Somnia Dream`
   - Chain ID: `50312`
   - RPC URL: `https://dream-rpc.somnia.network`
   - Currency Symbol: `STT`
4. **STT test tokens** in your wallet

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Run the Development Server

```bash
npm run dev
```

### 3. Open the App

Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

## How to Use

### Step 1: Connect Your Wallet
1. Click **"Connect Wallet"**
2. Approve the MetaMask connection request
3. Make sure you're on the Somnia Dream testnet

### Step 2: Register the Schema (One-Time Setup)
1. Click **"Register Schema"**
2. Approve the transaction in MetaMask
3. Wait for confirmation

> **Note:** If the schema is already registered, you'll see a message confirming this.

### Step 3: Publish Messages
1. Click **"Publish 'Hello World' Message"**
2. Approve the transaction in MetaMask
3. Watch your message appear in the subscriber section below!

### Step 4: Watch Messages Auto-Refresh
- The subscriber automatically fetches new messages every 3 seconds
- All your published messages will appear with timestamps

## Project Structure

```
/Users/kylemacabasco/Website/somnia-project/
├── app/
│   ├── page.tsx              # Main app component (Publisher + Subscriber)
│   └── layout.tsx            # Root layout
├── lib/
│   ├── dream-chain.ts        # Somnia Dream testnet configuration
│   └── somnia-sdk.ts         # SDK helper functions
├── types/
│   └── window.d.ts           # TypeScript definitions for window.ethereum
└── package.json
```

## Key Files Explained

### `/lib/dream-chain.ts`
Defines the Somnia Dream testnet configuration using viem's `defineChain`.

### `/lib/somnia-sdk.ts`
Helper functions for:
- Creating public and wallet clients
- Initializing the Somnia SDK
- Exporting the schema definition

### `/app/page.tsx`
The main application component that includes:
- Schema initialization and ID computation
- Wallet connection logic
- Schema registration function
- Message publishing functionality
- Real-time message subscriber with auto-refresh

## Schema Structure

The app uses the following data schema:

```solidity
string message, uint256 timestamp, address sender
```

Each message contains:
- **message**: The "Hello World #N" text
- **timestamp**: Unix timestamp when the message was published
- **sender**: Wallet address of the publisher

## Troubleshooting

### MetaMask Not Connecting
- Make sure MetaMask is installed
- Check that you're on the Somnia Dream testnet
- Try refreshing the page

### Transaction Failing
- Ensure you have enough STT tokens for gas
- Check that you're connected to the correct network
- Wait for previous transactions to confirm

### Schema Already Registered Error
- This is normal! It means the schema is already on-chain
- You can proceed to publish messages

### Messages Not Appearing
- Wait a few seconds for the auto-refresh
- Check the browser console for errors
- Ensure you're viewing messages from your connected wallet

## Learn More

- [Somnia Data Streams Documentation](https://docs.somnia.network/somnia-data-streams)
- [Hello World Tutorial](https://docs.somnia.network/somnia-data-streams/getting-started/hello-world-app)
- [SDK Methods Guide](https://docs.somnia.network/somnia-data-streams/getting-started/sdk-methods-guide)
- [Next.js Documentation](https://nextjs.org/docs)

## Next Steps

Now that you have a working Hello World app, you can:

1. **Customize the schema** - Add more fields like location, metadata, etc.
2. **Build a chat app** - Extend this to create real-time messaging
3. **Add filtering** - Subscribe to messages from specific publishers
4. **Create dashboards** - Build real-time data visualizations
5. **Explore IoT** - Stream sensor data to the blockchain

## Support

For questions or issues:
- [Somnia Developer Discord](https://discord.gg/somnia)
- [Somnia Documentation](https://docs.somnia.network)

---

**Built with ❤️ using Somnia Data Streams and Next.js**

