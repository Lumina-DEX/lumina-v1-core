"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useSearchParams } from "next/navigation";
import { PublicKey } from "o1js";
// @ts-ignore
import CurrencyFormat from "react-currency-format";

// @ts-ignore
const Liquidity = ({ accountState }) => {
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

  const [toAmount, setToAmount] = useState("0.0");

  const [slippagePercent, setSlippagePercent] = useState<number>(1);

  const [data, setData] = useState({ amountAIn: 0, amountBIn: 0, balanceAMax: 0, balanceBMax: 0, supplyMin: 0 });


  useEffect(() => {
    if (parseFloat(fromAmount)) {
      getLiquidityAmount(fromAmount, slippagePercent).then(x => setData(x));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromAmount, slippagePercent]);


  const getLiquidityAmount = async (fromAmt, slippagePcent) => {
    console.log("getLiquidityAmount", fromAmt);
    const { getAmountLiquidityOut } = await import("../../../contracts/build/src/indexmina");
    const reserves = await zkState?.zkappWorkerClient?.getReserves();
    console.log("reserve", reserves);
    let calcul = { amountAIn: 0, amountBIn: 0, balanceAMax: 0, balanceBMax: 0, supplyMin: 0 };
    const slippage = slippagePcent;
    if (reserves?.amountMina && reserves?.amountToken) {
      const amountMina = parseInt(reserves?.amountMina);
      const amountToken = parseInt(reserves?.amountToken);
      const liquidity = parseInt(reserves?.liquidity);
      let amt = parseFloat(fromAmt) * 10 ** 9;
      console.log("amtIn", amt);
      if (!toDai) {
        calcul = getAmountLiquidityOut(amt, amountToken, amountMina, liquidity, slippage);
        console.log("calcul from dai", calcul);
        let amtOut = calcul.amountBIn / 10 ** 9;
        setToAmount(amtOut.toString());
      } else {
        calcul = getAmountLiquidityOut(amt, amountMina, amountToken, liquidity, slippage);
        console.log("calcul from mina", calcul);
        let amtOut = calcul.amountBIn / 10 ** 9;
        setToAmount(amtOut.toString());
      }
    }
    return calcul;
  }

  const addLiquidity = async () => {
    try {
      setLoading(true);
      console.log("infos", { fromAmount, toAmount });

      if (mina) {
        console.log("zkState", zkState)
        const user: string = (await mina.requestAccounts())[0];
        if (!toDai) {
          await zkState.zkappWorkerClient?.addLiquidity(user, data.amountBIn, data.amountAIn, data.balanceBMax, data.balanceAMax, data.supplyMin);
        } else {
          await zkState.zkappWorkerClient?.addLiquidity(user, data.amountAIn, data.amountBIn, data.balanceAMax, data.balanceBMax, data.supplyMin);
        }
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

  return (
    <>
      <div className="flex flex-row justify-center w-full ">
        <div className="flex flex-col p-5 gap-5 items-center">
          <div className="text-xl">
            Add liquidity
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
            {toDai ? <span className="w-24 text-center">Mina</span> : <span className="w-24 text-center">TOKA</span>}
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
              decimalScale={6}
              placeholder="0.0"
              value={toAmount}
              onValueChange={({ value }) => setToAmount(value)}
            />
            {!toDai ? <span className="w-24 text-center">Mina</span> : <span className="w-24 text-center">TOKA</span>}
          </div>
          {/* <div>
            <span>Liquidity minted :</span>
          </div> */}
          <button onClick={addLiquidity} className="w-full bg-cyan-500 text-lg text-white p-1 rounded">
            Add Liquidity
          </button>
          {loading && <p>Creating transaction ...</p>}

        </div>
      </div>
    </>
  );
};

export default Liquidity;
