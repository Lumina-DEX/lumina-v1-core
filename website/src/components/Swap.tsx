"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useSearchParams } from "next/navigation";
import { PublicKey } from "o1js";
import { Token } from "@/types/token";
import CurrencyFormat from "react-currency-format";

type Percent = number | string;

const Swap = ({ accountState }) => {
  const [mina, setMina] = useState();

  useEffect(() => {
    if (window && (window as any).mina) {
      setMina((window as any).mina);
    }

  }, [])

  const zkState = accountState;

  const tokens = [
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
  ];


  const [fromToken, setFromToken] = useState<Token | undefined>(undefined);
  const [fromAmount, setFromAmount] = useState("");

  const [toToken, setToToken] = useState<Token | undefined>(undefined);
  const [toAmount, setToAmount] = useState("0.0");

  const [slippagePercent, setSlippagePercent] = useState<Percent>(0);


  useEffect(() => {
    setFromAmount("0");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromToken]);

  useEffect(() => {
    setToAmount("0");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toToken]);

  useEffect(() => {
    if (parseInt(fromAmount)) {
      getSwapAmount().then();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromAmount]);


  const getSwapAmount = async () => {
    const reserves = await zkState?.zkappWorkerClient?.getReserves();
    if (reserves?.amountMina && reserves?.amountToken) {
      const amountMina = parseInt(reserves?.amountMina);
      const amountToken = parseInt(reserves?.amountToken);
      let amtIn = parseFloat(fromAmount) * 10 ** 9;
      console.log("amtIn", amtIn);
      if (fromToken?.symbol == "DAI") {
        let calcul = (amountMina * amtIn / (amountToken + amtIn)) / 10 ** 9;
        // 1 % slippage
        calcul = calcul - (calcul) / 100;
        console.log("calcul from dai", calcul);
        setToAmount(calcul.toString());
      } else {
        let calcul = (amountToken * amtIn / (amountMina + amtIn)) / 10 ** 9;
        // 1 % slippage
        calcul = calcul - (calcul) / 100;
        console.log("calcul from mina", calcul);
        setToAmount(calcul.toString());
      }
    }
    console.log("reserves", reserves);
  }

  const swap = async () => {
    console.log("infos", { fromToken, fromAmount, toToken, toAmount });

    console.log("zkState", zkState)
    let user = zkState.publicKeyBase58!;
    let amtIn = parseFloat(fromAmount);
    let amtOut = parseFloat(toAmount);
    if (fromToken?.symbol == "DAI") {
      const create = await zkState.zkappWorkerClient?.swapFromToken(user, amtIn, amtOut);
    } else {
      const create = await zkState.zkappWorkerClient?.swapFromMina(user, amtIn, amtOut);
    }
    const json = await zkState.zkappWorkerClient?.getTransactionJSON();
    await mina!.sendTransaction({ transaction: json });
  }

  return (
    <>
      <div className="flex flex-row justify-center w-screen ">
        <div style={{ backgroundColor: "rgba(255,255,255,0.6)" }} className="flex flex-col p-5 gap-5 rounded w-[300px] h-[300px] items-center">
          <div className="text-3xl">
            Swap
          </div>
          <div className="flex flex-row w-full">
            <CurrencyFormat
              className="w-48 border-black text-default pr-3 text-xl text-right rounded focus:outline-none "
              thousandSeparator={true}
              decimalScale={2}
              placeholder="0.0"
              value={fromAmount}
              onValueChange={({ value }) => setFromAmount(value)}
            />
            <span className="w-24 text-center">Dai</span>
          </div>
          <div>
            <button className="w-8 bg-cyan-500 text-lg text-white rounded">
              &#8645;
            </button>
          </div>
          <div className="flex flex-row w-full">
            <CurrencyFormat
              className="w-48 border-slate-50 text-default  pr-3 text-xl text-right text-xl rounded focus:outline-none "
              thousandSeparator={true}
              decimalScale={2}
              placeholder="0.0"
              value={toAmount}
              onValueChange={({ value }) => setToAmount(value)}
            />
            <span className="w-24 text-center">Mina</span>
          </div>
          <button className="w-full bg-cyan-500 text-lg text-white p-1 rounded">
            Swap
          </button>
        </div>
      </div>
    </>
  );
};

export default Swap;
