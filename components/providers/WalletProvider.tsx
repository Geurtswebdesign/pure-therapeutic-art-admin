"use client";

import { createContext, useContext, useState } from "react";

type WalletContextType = {
  balance: number;
  setBalance: (value: number) => void;
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

  return (
    <WalletContext.Provider value={{ balance, setBalance }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("WalletProvider ontbreekt");
  return ctx;
}
