"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useSearchParams } from "next/navigation";
import { PublicKey } from "o1js";
// @ts-ignore
import CurrencyFormat from "react-currency-format";
import { poolToka } from "@/utils/addresses";
import TokenMenu from "./TokenMenu";
import Balance from "./Balance";

type Percent = number | string;



// @ts-ignore
const Swap = ({ accountState }) => {
  const [mina, setMina] = useState<any>();

  const [pool, setPool] = useState(poolToka);
  const [token, setToken] = useState({ address: "" });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (window && (window as any).mina) {
      setMina((window as any).mina);
    }

  }, [])

  const zkState = accountState;

  const [toDai, setToDai] = useState(true);

  const [fromAmount, setFromAmount] = useState("");

  const [toAmount, setToAmount] = useState("0.0");

  const [slippagePercent, setSlippagePercent] = useState<number>(15);

  const [data, setData] = useState({ amountIn: 0, amountOut: 0, balanceOutMin: 0, balanceInMax: 0 });


  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (parseFloat(fromAmount)) {
        getSwapAmount(fromAmount, slippagePercent).then(x => setData(x)).catch(x => console.error(x));
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn)
  }, [fromAmount, toDai, slippagePercent, pool, zkState.network]);

  const getSwapAmount = async (fromAmt, slippagePcent) => {

    const { getAmountOut } = await import("../../../contracts/build/src/indexmina");
    const reserves = await zkState?.zkappWorkerClient?.getReserves(pool);
    let calcul = { amountIn: 0, amountOut: 0, balanceOutMin: 0, balanceInMax: 0 };
    const slippage = slippagePcent;
    if (reserves?.amountMina && reserves?.amountToken) {
      const amountMina = parseInt(reserves?.amountMina);
      const amountToken = parseInt(reserves?.amountToken);
      let amt = parseFloat(fromAmt) * 10 ** 9;
      console.log("amtIn", amt);
      if (!toDai) {
        calcul = getAmountOut(amt, amountToken, amountMina, slippage);
        console.log("calcul from dai", calcul);
        let amtOut = calcul.amountOut / 10 ** 9;
        setToAmount(amtOut.toString());
      } else {
        calcul = getAmountOut(amt, amountMina, amountToken, slippage);
        console.log("calcul from mina", calcul);
        let amtOut = calcul.amountOut / 10 ** 9;
        setToAmount(amtOut.toString());
      }
    }
    return calcul;
  }

  const swap = async () => {
    try {
      setLoading(true);
      console.log("infos", { fromAmount, toAmount });

      if (mina) {
        console.log("zkState", zkState)
        // get time proof generation
        console.time("swap");
        const user: string = (await mina.requestAccounts())[0];
        if (!toDai) {
          await zkState.zkappWorkerClient?.swapFromToken(pool, user, data.amountIn, data.amountOut, data.balanceOutMin, data.balanceInMax);
        } else {
          await zkState.zkappWorkerClient?.swapFromMina(pool, user, data.amountIn, data.amountOut, data.balanceOutMin, data.balanceInMax);
        }
        const json = await zkState.zkappWorkerClient?.getTransactionJSON();
        console.timeEnd("swap");
        await mina.sendTransaction({ transaction: json });
      }
    } catch (error) {
      console.log('swap error', error);
    }
    finally {
      setLoading(false);
    }

  }

  return (
    <>
      <div className="flex flex-row justify-center w-full ">
        <div className="flex flex-col p-5 gap-5  items-center">
          <div className="text-xl">
            Swap
          </div>
          <div>
            <span className="font-light">Slippage (%) : </span><input type="number" className="pl-3" defaultValue={slippagePercent} onChange={(event) => setSlippagePercent(event.target.valueAsNumber)}></input>
          </div>
          <div className="flex flex-row w-full">
            <CurrencyFormat
              className="w-48 border-black text-default font-light pr-3 text-xl text-right rounded focus:outline-none "
              thousandSeparator={true}
              decimalScale={2}
              placeholder="0.0"
              value={fromAmount}
              onValueChange={({ value }) => setFromAmount(value)}
            />
            {toDai ? <span className="w-24 text-center">MINA</span> : <TokenMenu pool={pool} setToken={setToken} setPool={setPool} />}
          </div>
          <div>
            <button onClick={() => setToDai(!toDai)} className="w-8 bg-cyan-500 text-lg text-white rounded">
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
            {!toDai ? <span className="w-24 text-center">MINA</span> : <TokenMenu pool={pool} setToken={setToken} setPool={setPool} />}
          </div>
          <div>
            Your token balance : <Balance tokenAddress={token.address}></Balance>
          </div>
          <button onClick={swap} className="w-full bg-cyan-500 text-lg text-white p-1 rounded">
            Swap
          </button>
          {loading && <p>Creating transaction ...</p>}

        </div>
      </div>
    </>
  );
};

export default Swap;
