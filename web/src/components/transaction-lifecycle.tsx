"use client";

import React from "react";
import { CheckCircleIcon, AlertCircleIcon, ExternalLinkIcon } from "./icons";

interface TransactionLifecycleProps {
  status: "idle" | "broadcasting" | "polling" | "success" | "error";
  hash?: string;
  actionName?: string;
  errorMessage?: string;
  onClose?: () => void;
}

export function TransactionLifecycle({
  status,
  hash,
  actionName = "Transaction",
  errorMessage,
  onClose,
}: TransactionLifecycleProps) {
  if (status === "idle") return null;

  const explorerUrl = hash ? `https://explorer-studio.genlayer.com/tx/${hash}` : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
        <div className="flex items-start justify-between mb-4">
          <h3 className="font-semibold text-base text-zinc-100">{actionName}</h3>
          {status !== "broadcasting" && status !== "polling" && onClose && (
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-200 text-sm font-mono"
            >
              ✕
            </button>
          )}
        </div>

        {status === "broadcasting" && (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="w-12 h-12 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin mb-4" />
            <p className="font-medium text-sm text-zinc-200">Awaiting Wallet Signature</p>
            <p className="text-xs text-zinc-400 mt-1">Please confirm the transaction in MetaMask...</p>
          </div>
        )}

        {status === "polling" && (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="w-12 h-12 rounded-full border-2 border-emerald-500/20 border-t-emerald-400 animate-spin mb-4" />
            <p className="font-medium text-sm text-zinc-200">Awaiting Studionet Finality</p>
            <p className="text-xs text-zinc-400 mt-1">
              Consensus validators are finalizing the transaction on Chain 61999...
            </p>
            {hash && (
              <p className="font-mono text-[11px] text-zinc-400 mt-3 truncate max-w-xs bg-zinc-950 px-3 py-1 rounded-lg border border-zinc-800">
                Hash: {hash.slice(0, 10)}...{hash.slice(-8)}
              </p>
            )}
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 flex items-center justify-center mb-4">
              <CheckCircleIcon className="w-6 h-6" />
            </div>
            <p className="font-semibold text-sm text-zinc-100">Transaction Confirmed!</p>
            <p className="text-xs text-zinc-400 mt-1">
              State transitions have successfully finalized on-chain.
            </p>
            {explorerUrl && (
              <a
                href={explorerUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-mono"
              >
                <span>View on Studionet Explorer</span>
                <ExternalLinkIcon className="w-3.5 h-3.5" />
              </a>
            )}
            <button
              onClick={onClose}
              className="mt-5 w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 transition-colors"
            >
              Close
            </button>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-950/80 text-rose-400 border border-rose-800/80 flex items-center justify-center mb-4">
              <AlertCircleIcon className="w-6 h-6" />
            </div>
            <p className="font-semibold text-sm text-zinc-100">Transaction Failed</p>
            <p className="text-xs text-rose-400 mt-1 max-w-xs">{errorMessage || "Unknown error"}</p>
            <button
              onClick={onClose}
              className="mt-5 w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 transition-colors"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
