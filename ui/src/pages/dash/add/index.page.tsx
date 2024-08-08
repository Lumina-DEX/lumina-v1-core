import Layout from "@/components/Layout";
import TokenSelector from "@/components/Selector/TokenSelector";
import useTokens from "@/states/useTokens";
import React, { useEffect, useMemo, useState, ReactElement } from "react";
import { Button } from "react-daisyui";
import CurrencyFormat from "react-currency-format";
import useAccount from "@/states/useAccount";
import Decimal from "decimal.js";
import { Token } from "@/types/token";
import { useSearchParams, usePathname } from "next/navigation";
import { useRouter } from "next/router";
import type { NextPageWithLayout } from "@/pages/_app.page";

const AddLiquidityPanel: NextPageWithLayout = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromTokenSymbol = searchParams.get("fromToken");
  const toTokenSymbol = searchParams.get("toToken");

  const tokens = useTokens((state) =>
    Object.fromEntries(
      state.tokens.map((token) => [token.symbol.toLowerCase(), token])
    )
  );
  const balances = useAccount((state) => state.balances);

  const [fromToken, setFromToken] = useState<Token>(tokens[0]);
  const [fromAmount, setFromAmount] = useState("");
  const fromTokenBalance = useMemo(
    () => balances[fromToken?.symbol.toLowerCase() || ""] || 0,
    [balances, fromToken?.symbol]
  );

  const [toToken, setToToken] = useState<Token>(tokens[1]);
  const [toAmount, setToAmount] = useState("0.0");
  const toTokenBalance = useMemo(
    () => balances[toToken?.symbol.toLowerCase() || ""] || 0,
    [balances, toToken?.symbol]
  );

  useEffect(() => {
    if (fromTokenSymbol) {
      setFromToken(tokens[fromTokenSymbol]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(tokens), fromTokenSymbol]);

  useEffect(() => {
    if (toTokenSymbol) {
      setToToken(tokens[toTokenSymbol]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(tokens), toTokenSymbol]);

  useEffect(() => {
    setFromAmount("0");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromToken]);

  useEffect(() => {
    setToAmount("0");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toToken]);

  const onTokenSelect = (pos: "fromToken" | "toToken") => (token: Token) => {
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set(pos, token.symbol.toLowerCase());
    router.push({
      pathname: router.pathname,
      search: newSearchParams.toString(),
    });
  };

  return (
    <div className="font-metrophobic bg-light-200 card w-[470px] overflow-hidden max-[500px]:w-[400px] max-[420px]:w-[300px]">
      <div className="w-full p-8 bg-light-100">
        <div className="flex flex-col w-full gap-4">
          <h3 className="text-primary text-xl font-semibold text-left">
            Add Liquidity
          </h3>

          <div className="flex justify-between items-center w-full">
            <TokenSelector
              token={fromToken}
              setToken={onTokenSelect("fromToken")}
            />
            <span className="font-secondary">Balance {fromTokenBalance}</span>
          </div>
          <div className="flex justify-between items-center w-full">
            <div className="flex items-baseline gap-2">
              <CurrencyFormat
                className="bg-transparent text-default text-3xl focus:outline-none w-20"
                thousandSeparator={true}
                decimalScale={2}
                placeholder="0.0"
                value={fromAmount}
                onValueChange={({ value }) => setFromAmount(value)}
              />
              <CurrencyFormat
                className="font-secondary text-disabled"
                displayType="text"
                thousandSeparator={true}
                decimalScale={2}
                prefix="~$"
                value={new Decimal(fromToken?.usd_price || "0")
                  .times(fromAmount || "0")
                  .toString()}
              />
            </div>
            <div className="flex gap-2">
              <Button
                className="opacity-50"
                color="secondary"
                size="xs"
                onClick={() =>
                  setFromAmount((Number(fromTokenBalance) / 2).toString())
                }
              >
                50%
              </Button>
              <Button
                className="opacity-50"
                color="secondary"
                size="xs"
                onClick={() => setFromAmount(fromTokenBalance.toString())}
              >
                Max
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full p-8">
        <div className="flex flex-col w-full gap-4">
          <div className="flex justify-between items-center w-full">
            <TokenSelector
              token={toToken}
              setToken={onTokenSelect("toToken")}
            />
            <span className="font-secondary">Balance {toTokenBalance}</span>
          </div>
          <div className="flex justify-between items-center w-full">
            <div className="flex items-baseline gap-2">
              <CurrencyFormat
                className="bg-transparent text-default text-3xl focus:outline-none w-20"
                thousandSeparator={true}
                decimalScale={2}
                placeholder="0.0"
                value={toAmount}
                onValueChange={({ value }) => setToAmount(value)}
              />
              <CurrencyFormat
                className="font-secondary text-disabled"
                displayType="text"
                thousandSeparator={true}
                decimalScale={2}
                prefix="~$"
                value={new Decimal(toToken?.usd_price || "0")
                  .times(toAmount || "0")
                  .toString()}
              />
            </div>
            <div className="flex gap-2">
              <Button
                className="opacity-50"
                color="secondary"
                size="xs"
                onClick={() =>
                  setToAmount((Number(toTokenBalance) / 2).toString())
                }
              >
                50%
              </Button>
              <Button
                className="opacity-50"
                color="secondary"
                size="xs"
                onClick={() => setToAmount(toTokenBalance.toString())}
              >
                Max
              </Button>
            </div>
          </div>

          <div className="w-full flex justify-between gap-x-4">
            {fromToken && toToken ? (
              <>
                <Button className="grow shadow-md leading-5" color="primary">
                  Approve {fromToken.symbol.toUpperCase()}
                </Button>
                <Button className="grow shadow-md leading-5" color="primary">
                  Approve {toToken.symbol.toUpperCase()}
                </Button>
              </>
            ) : (
              <Button
                className="w-full h-[60px] min-h-0 bg-light-300 shadow-md pointer-events-none"
                color="neutral"
                size="lg"
              >
                Invalid Pair
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

AddLiquidityPanel.getLayout = function getLayout(page: ReactElement) {
  return <Layout>{page}</Layout>;
};

export default AddLiquidityPanel;
