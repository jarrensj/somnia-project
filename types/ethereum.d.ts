interface EthereumProvider {
  isMetaMask?: boolean
  request: (args: { method: string; params?: any[] }) => Promise<any>
  on?: (eventName: string, handler: (...args: any[]) => void) => void
  removeListener?: (eventName: string, handler: (...args: any[]) => void) => void
}

interface Window {
  ethereum?: EthereumProvider & {
    providers?: EthereumProvider[]
  }
}

