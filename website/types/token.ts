export type Token = {
  id: string;
  type: "Token" | "LP";
  symbol: string;
  icon?: string;
  usd_price?: string | number;
  price_change: number;
  day_volume?: number;
  liquidity?: number;
  balance?: number;
};

export type LPToken = Token & {
  symbol: string[];
  icon?: string[];
};
