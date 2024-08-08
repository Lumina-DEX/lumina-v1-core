import { Token } from "./token";

export interface Pool {
  from_token: Token;
  to_token: Token;
  lqxy: Token;
  total_liquidity: string;
  apr: number;
  US: boolean;
}
