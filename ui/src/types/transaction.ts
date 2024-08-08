export interface Transaction {
  fromToken: string;
  toToken: string;
  totalValue: number;
  fromTokenAmount: number;
  toTokenAmout: number;
  account: string;
  time: string;
}
