"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useSearchParams } from "next/navigation";
import { PublicKey } from "o1js";
// @ts-ignore
import CurrencyFormat from "react-currency-format";

// @ts-ignore
const Withdraw = ({ accountState }) => {
  const [mina, setMina] = useState<any>();

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (window && (window as any).mina) {
      setMina((window as any).mina);
    }

  }, [])

  const zkState = accountState;

  const [toDai, setToDai] = useState(true);

  const [fromAmount, setFromAmount] = useState("");

  const [toMina, setToMina] = useState(0);
  const [toToken, setToToken] = useState(0);

  const [slippagePercent, setSlippagePercent] = useState<number>(1);

  const [data, setData] = useState({ amountAOut: 0, amountBOut: 0, balanceAMin: 0, balanceBMin: 0, supplyMax: 0, liquidity: 0 });


  useEffect(() => {
    if (parseFloat(fromAmount)) {
      getLiquidityAmount(fromAmount, slippagePercent).then(x => setData(x));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromAmount, slippagePercent]);


  const getLiquidityAmount = async (fromAmt, slippagePcent) => {
    console.log("getLiquidityAmount", fromAmt);
    const { getAmountOutFromLiquidity } = await import("../../../contracts/build/src/indexmina");
    const reserves = await zkState?.zkappWorkerClient?.getReserves();
    console.log("reserve", reserves);
    let calcul = { amountAOut: 0, amountBOut: 0, balanceAMin: 0, balanceBMin: 0, supplyMax: 0, liquidity: 0 };
    const slippage = slippagePcent;
    if (reserves?.amountMina && reserves?.amountToken) {
      const amountMina = parseInt(reserves?.amountMina);
      const amountToken = parseInt(reserves?.amountToken);
      const liquidity = parseInt(reserves?.liquidity);
      let amt = parseFloat(fromAmt) * 10 ** 9;
      console.log("amtIn", amt);
      calcul = getAmountOutFromLiquidity(amt, amountMina, amountToken, liquidity, slippage);
      console.log("calcul from dai", calcul);
      let amtMina = calcul.amountAOut / 10 ** 9;
      let amtToken = calcul.amountBOut / 10 ** 9;
      setToMina(amtMina);
      setToToken(amtToken);
    }
    return calcul;
  }

  const withdrawLiquidity = async () => {
    try {
      setLoading(true);
      console.log("infos", { fromAmount });

      if (mina) {
        const user: string = (await mina.requestAccounts())[0];

        await zkState.zkappWorkerClient?.withdrawLiquidity(user, data.liquidity, data.amountAOut, data.amountBOut, data.balanceAMin, data.balanceBMin, data.supplyMax);

        const json = await zkState.zkappWorkerClient?.getTransactionJSON();
        await mina.sendTransaction({ transaction: json });
      }
    } catch (error) {
      console.log('swap error', error);
    }
    finally {
      setLoading(false);
    }

  }

  function toFixedIfNecessary(value, dp) {
    return +parseFloat(value).toFixed(dp);
  }

  return (
    <>
      <div className="flex flex-row justify-center w-full ">
        <div className="flex flex-col p-5 gap-5 items-center">
          <div className="text-xl">
            Withdraw liquidity
          </div>
          <div>
            <span>Slippage (%) : </span><input type="number" defaultValue={slippagePercent} onChange={(event) => setSlippagePercent(event.target.valueAsNumber)}></input>
          </div>
          <div className="flex flex-row w-full">
            <CurrencyFormat
              className="w-48 border-black text-default pr-3 text-xl text-right rounded focus:outline-none "
              thousandSeparator={true}
              decimalScale={6}
              placeholder="0.0"
              value={fromAmount}
              onValueChange={({ value }) => setFromAmount(value)}
            />
            <span className="w-24 text-center">LUM</span>
          </div>
          <div>
            <span>MINA out : {toFixedIfNecessary(toMina, 2)}</span>
          </div>
          <div>
            <span>TOKA out : {toFixedIfNecessary(toToken, 2)}</span>
          </div>
          <button onClick={withdrawLiquidity} className="w-full bg-cyan-500 text-lg text-white p-1 rounded">
            Withdraw Liquidity
          </button>
          {loading && <p>Creating transaction ...</p>}

        </div>
      </div>
    </>
  );
};

export default Withdraw;