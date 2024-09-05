"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useSearchParams } from "next/navigation";
import { PublicKey } from "o1js";
// @ts-ignore
import CurrencyFormat from "react-currency-format";

// @ts-ignore
const Account = ({ accountState }) => {
  const [mina, setMina] = useState<any>();
  const [information, setInformation] = useState<any>({ account: "", network: "", mina: 0, token: 0, liquidity: 0 });
  const [isZeko, setIsZeko] = useState(false);

  const zkState = accountState;

  useEffect(() => {
    if (window && (window as any).mina) {
      setMina((window as any).mina);
    }
    zkState?.zkappWorkerClient?.getActiveInstance().then(x => setIsZeko(x.isZeko));

  }, [])

  useEffect(() => {
    if (mina && zkState) {
      getUserInformation(mina).then(x => setInformation(x))
    }
    const intervalID = setInterval(() => {
      if (mina && zkState) {
        getUserInformation(mina).then(x => setInformation(x))
      }
    }, 10000);

    return () => clearInterval(intervalID);
  }, [mina, isZeko]);


  const getUserInformation = async (auroMina) => {
    try {
      const accounts = await auroMina.getAccounts();
      console.log("accounts");
      const account = accounts[0];
      const newtwork = await auroMina.requestNetwork();
      const balances = await zkState?.zkappWorkerClient?.getBalances(account);
      const mina = parseInt(balances.mina) / 10 ** 9;
      const token = parseInt(balances.token) / 10 ** 9;
      const liquidity = parseInt(balances.liquidity) / 10 ** 9;
      return { account, network: newtwork.networkID, mina, token, liquidity };
    } catch (error) {
      console.error("getUserInformation", error);
    }
  }

  const switchNetwork = async (zeko: boolean) => {
    try {
      if (zeko) {
        await zkState?.zkappWorkerClient?.setActiveInstanceToZeko();
      } else {
        await zkState?.zkappWorkerClient?.setActiveInstanceToDevnet();
      }
      setInformation({ ...information });
      setIsZeko(zeko);
    } catch (error) {
      console.error("getUserInformation", error);
    }
  }

  return (
    <>
      <div className="flex flex-col justify-center w-screen p-5 " style={{ position: "fixed", top: "0", left: "0", backgroundColor: "white" }} >
        <div>
          Account : {information.account}
        </div>
        <div>
          Network : {information.network}
        </div>
        <div>
          ZkApp Network : {isZeko ? "Zeko" : "testnet"}
          <button className="bg-cyan-500 text-lg text-white p-1 rounded m-1" onClick={() => switchNetwork(false)}>Testnet</button>
          <button className="bg-cyan-500 text-lg text-white p-1 rounded  m-1" onClick={() => switchNetwork(true)}>Zeko</button>
        </div>
        <div>
          Balance mina : {information.mina}
        </div>
        <div>
          Balance Token (TOKA) : {information.token}
        </div>
        <div>
          Balance Liquidity (LUM) : {information.liquidity}
        </div>
      </div>
    </>
  );
};

export default Account;
