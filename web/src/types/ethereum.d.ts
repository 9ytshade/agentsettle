export interface EthereumRequestArgs {
  method: string;
  params?: unknown[] | Record<string, unknown>;
}

export interface EthereumProvider {
  request: (args: EthereumRequestArgs) => Promise<unknown>;
  on?: (eventName: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (eventName: string, handler: (...args: unknown[]) => void) => void;
  isMetaMask?: boolean;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}
