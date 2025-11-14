# Data Stream Composer 

This project uses Somnia Data Streams to listen to data on the blockchain. The projects listens to the data streams and if there is a transfer transaction, a noise / beat is played by this application. Depending on the size of the transfer, the noise / beat is affected accordingly. This helps the user keep an ongoing pulse of the ticker or whatever they are monitoring. 

Users can monitor either native SOMI token transfers or any custom ERC-20 token of their choice by entering the token contract address in the Filters menu. They can listen (literally) to the transactions happening on the chain in real-time. 

The project composes audio for the user to hear the stream and be able to react to.

## Getting Started

Install dependences:

```bash
npm install
```

Set up your .env file:
```bash
cp .env.example .env
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser
