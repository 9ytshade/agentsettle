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
    <div
      onClick={() => {
        if (status !== "broadcasting" && status !== "polling" && onClose) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-[16px] border border-[#292d30] bg-[#0b0e14] p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between mb-4">
          <h3 className="font-medium text-base text-white">{actionName}</h3>
          {status !== "broadcasting" && status !== "polling" && onClose && (
            <button
              onClick={onClose}
              className="text-[#a1a4a5] hover:text-white text-sm font-mono transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        {status === "broadcasting" && (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="w-12 h-12 rounded-full border-2 border-[#292d30] border-t-[#9281f7] animate-spin mb-4" />
            <p className="font-medium text-sm text-[#f0f0f0]">Awaiting Wallet Signature</p>
            <p className="text-xs text-[#a1a4a5] mt-1">Please confirm the transaction in MetaMask...</p>
          </div>
        )}

        {status === "polling" && (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="w-12 h-12 rounded-full border-2 border-[#292d30] border-t-[#9281f7] animate-spin mb-4" />
            <p className="font-medium text-sm text-[#f0f0f0]">Awaiting Studionet Finality</p>
            <p className="text-xs text-[#a1a4a5] mt-1">
              Consensus validators are finalizing the transaction on Chain 61999...
            </p>
            {hash && (
              <p className="font-mono text-[11px] text-[#9281f7] mt-3 truncate max-w-xs bg-[#0b0e14] px-3 py-1.5 rounded-[6px] border border-[#292d30]">
                Hash: {hash.slice(0, 10)}...{hash.slice(-8)}
              </p>
            )}
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="w-12 h-12 rounded-[6px] bg-[#0b0e14] text-[#3ad389] border border-[#292d30] flex items-center justify-center mb-4">
              <CheckCircleIcon className="w-6 h-6" />
            </div>
            <p className="font-medium text-sm text-white">Transaction Confirmed</p>
            <p className="text-xs text-[#a1a4a5] mt-1">
              State transitions have successfully finalized on-chain.
            </p>
            {explorerUrl && (
              <a
                href={explorerUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 text-xs text-[#9281f7] hover:text-[#baa7ff] font-mono transition-colors"
              >
                <span>View on Studionet Explorer</span>
                <ExternalLinkIcon className="w-3.5 h-3.5" />
              </a>
            )}
            <button
              onClick={onClose}
              className="mt-5 w-full py-2.5 rounded-[6px] border border-[#292d30] hover:border-white bg-transparent text-[#ffffff] font-medium text-xs transition-colors"
            >
              Close
            </button>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="w-12 h-12 rounded-[6px] bg-[#0b0e14] text-[#ff9592] border border-[#292d30] flex items-center justify-center mb-4">
              <AlertCircleIcon className="w-6 h-6" />
            </div>
            <p className="font-medium text-sm text-white">Transaction Failed</p>
            <p className="text-xs text-[#ff9592] mt-1 max-w-xs font-mono">{errorMessage || "Unknown error"}</p>
            <button
              onClick={onClose}
              className="mt-5 w-full py-2.5 rounded-[6px] border border-[#292d30] hover:border-white bg-transparent text-[#ffffff] font-medium text-xs transition-colors"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
