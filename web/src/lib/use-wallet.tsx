"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { STUDIONET_CHAIN_ID, STUDIONET_RPC } from "./genlayer";
import { formatAddress, formatGen } from "./safety";

const DISCONNECT_KEY = "agentsettle-wallet-disconnected";
const LAST_ACCOUNT_KEY = "agentsettle-last-account";

function isUserRejection(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as { code?: number; rpcCode?: number };
  return err.code === 4001 || err.rpcCode === 4001;
}

let isReloadingGlobal = false;
export function refreshPage(delayMs = 250) {
  if (typeof window === "undefined" || isReloadingGlobal) return;
  isReloadingGlobal = true;
  window.setTimeout(() => {
    window.location.reload();
  }, delayMs);
}

export interface WalletContextValue {
  account: string;
  balance: string;
  rawWei: string;
  isConnected: boolean;
  isConnecting: boolean;
  wrongNetwork: boolean;
  reloading: boolean;
  connect: () => Promise<boolean>;
  disconnect: () => Promise<void>;
  changeAccount: () => Promise<void>;
  switchNetwork: () => Promise<void>;
  refreshAccount: () => Promise<string>;
  getSignerClient: () => ReturnType<typeof createClient> | null;
  assertStudionet: () => Promise<boolean>;
  formatAddress: (addr: string) => string;
}

const defaultWalletState: WalletContextValue = {
  account: "",
  balance: "",
  rawWei: "",
  isConnected: false,
  isConnecting: false,
  wrongNetwork: false,
  reloading: false,
  connect: async () => false,
  disconnect: async () => {},
  changeAccount: async () => {},
  switchNetwork: async () => {},
  refreshAccount: async () => "",
  getSignerClient: () => null,
  assertStudionet: async () => false,
  formatAddress,
};

const WalletContext = createContext<WalletContextValue>(defaultWalletState);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<string>("");
  const [balance, setBalance] = useState<string>("");
  const [rawWei, setRawWei] = useState<string>("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [reloading, setReloading] = useState(false);
  const [wrongNetwork, setWrongNetwork] = useState(false);
  const [locallyDisconnected, setLocallyDisconnected] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.sessionStorage.getItem(DISCONNECT_KEY) === "true";
  });

  const checkNetworkAndBalance = useCallback(async (addr: string) => {
    if (!window.ethereum || !addr) return;
    try {
      const chainIdHex = (await window.ethereum.request({ method: "eth_chainId" })) as string;
      const currentChainId = parseInt(chainIdHex, 16);
      const isWrong = currentChainId !== STUDIONET_CHAIN_ID;
      setWrongNetwork(isWrong);

      if (!isWrong) {
        const balHex = (await window.ethereum.request({
          method: "eth_getBalance",
          params: [addr, "latest"],
        })) as string;
        if (balHex) {
          setRawWei(balHex);
          setBalance(formatGen(BigInt(balHex)));
        }
      }
    } catch {
      // Ignored
    }
  }, []);

  const refreshAccount = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      setAccount("");
      return "";
    }
    if (locallyDisconnected) {
      setAccount("");
      return "";
    }
    try {
      const accs = (await window.ethereum.request({ method: "eth_accounts" })) as string[];
      const first = Array.isArray(accs) && accs[0] ? accs[0].toLowerCase().trim() : "";
      setAccount(first);
      if (first) {
        window.sessionStorage.setItem(LAST_ACCOUNT_KEY, first);
        void checkNetworkAndBalance(first);
      } else {
        window.sessionStorage.removeItem(LAST_ACCOUNT_KEY);
      }
      return first;
    } catch {
      setAccount("");
      return "";
    }
  }, [locallyDisconnected, checkNetworkAndBalance]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refreshAccount();
    }, 0);
    if (typeof window === "undefined" || !window.ethereum) return;

    const onAccountsChanged = (accounts: unknown) => {
      const list = Array.isArray(accounts) ? accounts : [];
      const next = list.length > 0 && typeof list[0] === "string" ? list[0].toLowerCase().trim() : "";
      const current = window.sessionStorage.getItem(LAST_ACCOUNT_KEY) || "";

      if (list.length === 0 || !next) {
        // Disconnected in wallet provider
        window.sessionStorage.setItem(DISCONNECT_KEY, "true");
        window.sessionStorage.removeItem(LAST_ACCOUNT_KEY);
        setLocallyDisconnected(true);
        setAccount("");
        setBalance("");
        setRawWei("");
        setReloading(true);
        refreshPage(150);
        return;
      }

      if (next !== current) {
        // Switched account in wallet provider
        window.sessionStorage.removeItem(DISCONNECT_KEY);
        window.sessionStorage.setItem(LAST_ACCOUNT_KEY, next);
        setLocallyDisconnected(false);
        setAccount(next);
        setReloading(true);
        refreshPage(150);
      }
    };

    const onChainChanged = () => {
      setReloading(true);
      refreshPage(150);
    };

    window.ethereum.on?.("accountsChanged", onAccountsChanged);
    window.ethereum.on?.("chainChanged", onChainChanged);

    return () => {
      window.clearTimeout(timer);
      window.ethereum?.removeListener?.("accountsChanged", onAccountsChanged);
      window.ethereum?.removeListener?.("chainChanged", onChainChanged);
    };
  }, [refreshAccount]);

  const switchNetwork = useCallback(async () => {
    if (!window.ethereum) throw new Error("MetaMask is not installed");
    const targetHex = `0x${STUDIONET_CHAIN_ID.toString(16)}`;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: targetHex }],
      });
      setWrongNetwork(false);
      setReloading(true);
      refreshPage(150);
    } catch (switchErr: unknown) {
      const err = switchErr as { code?: number };
      if (err.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: targetHex,
              chainName: "GenLayer Studionet",
              nativeCurrency: {
                name: "GEN",
                symbol: "GEN",
                decimals: 18,
              },
              rpcUrls: [STUDIONET_RPC],
              blockExplorerUrls: ["https://explorer-studio.genlayer.com"],
            },
          ],
        });
        setWrongNetwork(false);
        setReloading(true);
        refreshPage(150);
      } else {
        throw switchErr;
      }
    }
  }, []);

  const assertStudionet = useCallback(async (): Promise<boolean> => {
    if (!window.ethereum) {
      throw new Error("No Web3 wallet detected. Please install MetaMask to interact with AgentSettle.");
    }
    try {
      const chainIdHex = (await window.ethereum.request({ method: "eth_chainId" })) as string;
      const currentChainId = parseInt(chainIdHex, 16);
      if (currentChainId !== STUDIONET_CHAIN_ID) {
        await switchNetwork();
        const updatedHex = (await window.ethereum.request({ method: "eth_chainId" })) as string;
        const updatedChainId = parseInt(updatedHex, 16);
        if (updatedChainId !== STUDIONET_CHAIN_ID) {
          setWrongNetwork(true);
          throw new Error(
            "Transaction blocked: active wallet network is not GenLayer Studionet (Chain 61999)."
          );
        }
      }
      setWrongNetwork(false);
      return true;
    } catch (err: unknown) {
      setWrongNetwork(true);
      throw err;
    }
  }, [switchNetwork]);

  const connect = useCallback(async (): Promise<boolean> => {
    if (typeof window === "undefined" || !window.ethereum) {
      alert("Please install MetaMask to interact with AgentSettle.");
      return false;
    }
    setIsConnecting(true);
    try {
      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];
      const first = Array.isArray(accounts) && accounts[0] ? accounts[0].toLowerCase().trim() : "";
      if (!first) return false;

      window.sessionStorage.removeItem(DISCONNECT_KEY);
      window.sessionStorage.setItem(LAST_ACCOUNT_KEY, first);
      setLocallyDisconnected(false);
      setAccount(first);

      await assertStudionet();
      await checkNetworkAndBalance(first);

      setReloading(true);
      refreshPage(150);
      return true;
    } catch (err) {
      if (isUserRejection(err)) return false;
      console.error("Connect failed:", err);
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, [assertStudionet, checkNetworkAndBalance]);

  const disconnect = useCallback(async () => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(DISCONNECT_KEY, "true");
      window.sessionStorage.removeItem(LAST_ACCOUNT_KEY);
    }
    setLocallyDisconnected(true);
    setAccount("");
    setBalance("");
    setRawWei("");
    setReloading(true);
    refreshPage(150);
  }, []);

  const changeAccount = useCallback(async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }],
      });
      await connect();
    } catch (err) {
      if (isUserRejection(err)) return;
      console.warn("Change account rejected:", err);
    }
  }, [connect]);

  const getSignerClient = useCallback(() => {
    if (!account) return null;
    if (wrongNetwork) {
      throw new Error(
        "Transaction blocked: active wallet network is not GenLayer Studionet (Chain 61999). Please switch network to continue."
      );
    }
    return createClient({
      chain: studionet,
      endpoint: STUDIONET_RPC,
      account: account as `0x${string}`,
    });
  }, [account, wrongNetwork]);

  const value = useMemo<WalletContextValue>(
    () => ({
      account,
      balance,
      rawWei,
      isConnected: Boolean(account),
      isConnecting,
      wrongNetwork,
      reloading,
      connect,
      disconnect,
      changeAccount,
      switchNetwork,
      refreshAccount,
      getSignerClient,
      assertStudionet,
      formatAddress,
    }),
    [
      account,
      balance,
      rawWei,
      isConnecting,
      wrongNetwork,
      reloading,
      connect,
      disconnect,
      changeAccount,
      switchNetwork,
      refreshAccount,
      getSignerClient,
      assertStudionet,
    ]
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  return useContext(WalletContext);
}
