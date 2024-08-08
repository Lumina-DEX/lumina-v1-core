import { Token } from "@/types/token";
import { create } from "zustand";

interface TokenState {
  tokens: Token[];
  update: (tokens: Token[]) => void;
}

const useTokens = create<TokenState>((set) => ({
  tokens: [
    {
      id: "0a5bb10c-e97a-4b37-a7a4-2ab7b53f3f0f",
      type: "Token",
      symbol: "MINA",
      icon: "/assets/tokens/lumina.png",
      usd_price: 1.3,
      price_change: 3.09,
      day_volume: 3342156,
      liquidity: 512345673,
    },
    {
      id: "45845269-b641-4270-977b-14a6241ce0b8",
      type: "Token",
      symbol: "DAI",
      icon: "/assets/tokens/dai.png",
      usd_price: 0.07,
      price_change: 3.09,
      day_volume: 3342156,
      liquidity: 512345673,
    },
  ],
  update: (tokens: Token[]) => {
    set(() => ({ tokens }));
  },
}));

export default useTokens;
