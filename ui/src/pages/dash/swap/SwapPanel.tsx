import TokenSelector from "@/components/Selector/TokenSelector";
import TransactionsSetting from "@/components/DropDown/TransactionSettings";
import useAccount from "@/states/useAccount";
import useTokens from "@/states/useTokens";
import { Token } from "@/types/token";
import clsx from "classnames";
import Decimal from "decimal.js";
import React, { useEffect, useMemo, useState } from "react";
import CurrencyFormat from "react-currency-format";
import { Button, Dropdown, Tabs } from "react-daisyui";
import { BiCog } from "react-icons/bi";
import { useRouter } from "next/router";
import { useSearchParams } from "next/navigation";
import useLoad from "@/states/useLoad";
import { connect } from "@/lib/wallet";

type Percent = number | string;

const SwapPanel: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromTokenSymbol = searchParams.get("fromToken");
  const toTokenSymbol = searchParams.get("toToken");

  const tokens = useTokens((state) =>
    Object.fromEntries(
      state.tokens.map((token) => [token.symbol.toLowerCase(), token])
    )
  );
  const { kycVerified, address, balances } = useAccount((state) => ({
    kycVerified: state.kycVerified,
    address: state.publicKeyBase58,
    balances: state.balances,
  }));
  const [tabValue, setTabValue] = useState(0);

  const [fromToken, setFromToken] = useState<Token | undefined>(undefined);
  const [fromAmount, setFromAmount] = useState("");
  const fromTokenBalance = useMemo(
    () => balances[(fromToken?.symbol || "").toLowerCase()] || 0,
    [balances, fromToken]
  );

  const [toToken, setToToken] = useState<Token | undefined>(undefined);
  const [toAmount, setToAmount] = useState("0.0");
  const toTokenBalance = useMemo(
    () => balances[(toToken?.symbol || "").toLowerCase()] || 0,
    [balances, toToken]
  );

  const [slippagePercent, setSlippagePercent] = useState<Percent>(0);

  const { loadState } = useLoad((state) => ({
    loadState: state.state,
  }));

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

  const onConnectWallet = async () => {
    connect();
  };

  const onTokenSelect = (pos: "fromToken" | "toToken") => (token: Token) => {
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set(pos, token.symbol.toLowerCase());
    router.push({
      pathname: router.pathname,
      search: newSearchParams.toString(),
    });
  };

  return (
    <>
      {/* Swap from */}
      <div className="relative w-full p-8 pt-16 bg-light-100 font-metrophobic">
        <div className="absolute top-3 right-3 cursor-pointer">
          <div className="flex items-center gap-2">
            {/* Slippage Tolerance */}
            <div className="flex gap-2 text-black">
              <span className="text-sm">Slippage Tolerance</span>
              <span className="text-sm">
                {typeof slippagePercent === "number"
                  ? new Intl.NumberFormat("en-US", {
                      style: "percent",
                      maximumFractionDigits: 2,
                    }).format(slippagePercent / 100)
                  : "Invalid"}
              </span>
            </div>
            <Dropdown
              horizontal="left"
              vertical="bottom"
              className="leading-none"
            >
              <Dropdown.Toggle className="[&>button]:p-0">
                <BiCog className="text-default p-0" size={30} />
              </Dropdown.Toggle>
              <TransactionsSetting setSlippagePercent={setSlippagePercent} />
            </Dropdown>
          </div>
        </div>
        <div className="flex flex-col w-full gap-2">
          <div className="flex justify-between items-center w-full">
            <TokenSelector
              token={fromToken}
              setToken={onTokenSelect("fromToken")}
            />
            <span className="font-metrophobic">Balance {fromTokenBalance}</span>
          </div>
          <div className="flex flex-col">
            <div className="flex justify-between items-center w-full flex-row">
              <div className="basis-1/2">
                <div className="flex flex-row items-baseline gap-2 justify-between">
                  <div className="text-left">
                    <CurrencyFormat
                      className="w-full bg-transparent text-default text-3xl focus:outline-none "
                      thousandSeparator={true}
                      decimalScale={2}
                      placeholder="0.0"
                      value={fromAmount}
                      onValueChange={({ value }) => setFromAmount(value)}
                    />
                  </div>
                  <div className="text-left">
                    <CurrencyFormat
                      className="w-full font-metrophobic text-disabled"
                      displayType="text"
                      thousandSeparator={true}
                      decimalScale={2}
                      prefix="~$"
                      value={new Decimal(fromToken?.usd_price || "0")
                        .times(fromAmount || "0")
                        .toString()}
                    />
                  </div>
                </div>
              </div>
              <div className="basis-1/2">
                <div className="flex justify-end gap-x-2">
                  <Button
                    className="text-white bg-pink-200"
                    color="secondary"
                    size="xs"
                    onClick={() =>
                      setFromAmount((Number(fromTokenBalance) / 2).toString())
                    }
                  >
                    50%
                  </Button>
                  <Button
                    className="text-white bg-pink-200"
                    color="secondary"
                    size="xs"
                    onClick={() => setFromAmount(fromTokenBalance.toString())}
                  >
                    Max
                  </Button>
                </div>
              </div>
            </div>
            <span className="text-sm">Pay</span>
          </div>
        </div>
      </div>

      {/* Swap to */}
      <div className="w-full p-8 font-metrophobic">
        <div className="flex flex-col w-full gap-4">
          <div className="flex flex-col w-full gap-2">
            <div className="flex justify-between items-center w-full">
              <TokenSelector
                token={toToken}
                setToken={onTokenSelect("toToken")}
              />
              <span className="font-metrophobic">Balance {toTokenBalance}</span>
            </div>
            <div className="flex flex-col">
              <div className="flex flex-row">
                <div className="basis-1/2">
                  <div className="flex flex-row items-baseline gap-2 justify-between">
                    <div className="text-left">
                      <CurrencyFormat
                        displayType="text"
                        className="w-full bg-transparent text-default text-3xl text-left focus:outline-none"
                        thousandSeparator={true}
                        decimalScale={2}
                        placeholder="0.0"
                        value={toAmount}
                      />
                    </div>
                    <div className="text-left">
                      <CurrencyFormat
                        displayType="text"
                        className="font-metrophobic text-disabled"
                        thousandSeparator={true}
                        decimalScale={2}
                        prefix="~$"
                        value={new Decimal(toToken?.usd_price || "0")
                          .times(toAmount || "0")
                          .toString()}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <span className="text-sm">Receive</span>
            </div>
          </div>

          {address ? (
            <div className="flex flex-col gap-y-4">
              <Button
                className="w-full h-[60px] min-h-0 shadow-md font-orbitron"
                color="primary"
                size="lg"
                disabled={!loadState}
              >
                Swap
              </Button>
              {!kycVerified && address && (
                <span>
                  Complete KYC to access additional permissioned pool liquidity
                </span>
              )}
            </div>
          ) : (
            <Button
              className="btn-primary text-white font-orbitron"
              onClick={onConnectWallet}
              disabled={!loadState}
            >
              Connect Wallet
            </Button>
          )}

          <a
            href="https://twitter.com/intent/tweet?button_hashtag=LuminaDEXchallenge&ref_src=twsrc%5Etfw"
            className="twitter-hashtag-button"
            data-size="large"
            data-text="Check out the #LuminaDEXchallenge on app.luminadex.com. I just swapped some testnet tokens and you can too!"
            data-url="https://luminadex.com/"
            data-related="luminadex"
            data-show-count="false"
          >
            Tweet #LuminaDEXchallenge
          </a>
        </div>
      </div>
    </>
  );
};

export default SwapPanel;
