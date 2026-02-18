"use client";

import { useWallet } from "@/components/providers/WalletProvider";

export default function WalletDebug() {
  const { balance } = useWallet();

  return (
    <div style={{ position: "fixed", bottom: 20, right: 20 }}>
      <div style={{ background: "black", color: "white", padding: 10 }}>
        💳 Balance: {balance}
      </div>
    </div>
  );
}

