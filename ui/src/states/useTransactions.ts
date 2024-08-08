import { Transaction } from "@/types/transaction";
import { create } from "zustand";

interface TransactionState {
  transactions: Transaction[];
  update: (transactions: Transaction[]) => void;
}

const useTransactions = create<TransactionState>((set) => ({
  transactions: [
    {
      fromToken: "CELO",
      toToken: "WETH",
      totalValue: 60.63,
      fromTokenAmount: 85.813,
      toTokenAmout: 0.029,
      account: "0x7a83d298",
      time: "24 mins ago",
    },
    {
      fromToken: "CELO",
      toToken: "WETH",
      totalValue: 60.63,
      fromTokenAmount: 85.813,
      toTokenAmout: 0.029,
      account: "0x7a83d298",
      time: "24 mins ago",
    },
    {
      fromToken: "CELO",
      toToken: "WETH",
      totalValue: 60.63,
      fromTokenAmount: 85.813,
      toTokenAmout: 0.029,
      account: "0x7a83d298",
      time: "24 mins ago",
    },
    {
      fromToken: "CELO",
      toToken: "WETH",
      totalValue: 60.63,
      fromTokenAmount: 85.813,
      toTokenAmout: 0.029,
      account: "0x7a83d298",
      time: "24 mins ago",
    },
    {
      fromToken: "CELO",
      toToken: "WETH",
      totalValue: 60.63,
      fromTokenAmount: 85.813,
      toTokenAmout: 0.029,
      account: "0x7a83d298",
      time: "24 mins ago",
    },
  ],
  update: (transactions: Transaction[]) => {
    set(() => ({ transactions }));
  },
}));

export default useTransactions;
