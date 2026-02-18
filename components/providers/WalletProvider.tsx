"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { refreshBalance } from "@/lib/credits/refreshBalance";

type WalletContextType = {
  balance: number;
  setBalance: React.Dispatch<React.SetStateAction<number>>;
  applyDelta: (delta: number) => void;
  refresh: () => Promise<void>;
};

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({
  initialBalance,
  children,
}: {
  initialBalance: number;
  children: React.ReactNode;
}) {
  const [balance, setBalance] = useState(initialBalance);

  const applyDelta = useCallback((delta: number) => {
    // ✅ voorkomt stale state
    setBalance((b) => b + delta);
  }, []);

  const refresh = useCallback(async () => {
    const latest = await refreshBalance();
    setBalance(latest);
  }, []);

  return (
    <WalletContext.Provider value={{ balance, setBalance, applyDelta, refresh }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("WalletProvider ontbreekt");
  return ctx;
}
