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
  const [information, setInformation] = useState<any>({ account: "", network: "", mina: 0, token: 0 });

  const zkState = accountState;

  useEffect(() => {
    if (window && (window as any).mina) {
      setMina((window as any).mina);
    }

  }, [])

  useEffect(() => {
    const intervalID = setInterval(() => {
      if (mina && zkState) {
        getUserInformation(mina).then(x => setInformation(x))
      }
    }, 3000);

    return () => clearInterval(intervalID);
  }, [mina]);


  const getUserInformation = async (auroMina) => {
    try {

      const accounts = await auroMina.getAccounts();
      console.log("accounts");
      const account = accounts[0];
      const newtwork = await auroMina.requestNetwork();
      const balances = await zkState?.zkappWorkerClient?.getBalances(account);
      const mina = parseInt(balances.mina) / 10 ** 9;
      const token = parseInt(balances.token) / 10 ** 9;
      return { account, network: newtwork.networkID, mina, token };
    } catch (error) {
      console.error("getUserInformation", error);
    }
  }

  return (
    <>
      <div className="flex flex-col justify-center w-screen p-5 " style={{ position: "fixed", top: "0", backgroundColor: "rgba(120,120,120,0.4)" }} >
        <div>
          Account : {information.account}
        </div>
        <div>
          Network : {information.network}
        </div>
        <div>
          Balance mina : {information.mina}
        </div>
        <div>
          Balance Token : {information.token}
        </div>
      </div>
    </>
  );
};

export default Account;
