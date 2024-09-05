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
  const [isZeko, setIsZeko] = useState(true);
  const [network, setNetwork] = useState("zeko");

  const zkState = accountState;

  useEffect(() => {
    if (window && (window as any).mina) {
      setMina((window as any).mina);
    }
    zkState?.zkappWorkerClient?.getActiveInstance().then(x => setIsZeko(x.isZeko));

  }, [])

  useEffect(() => {
    if (mina && zkState) {
      getUserInformation(mina).then(x => setInformation(x));
      switchNetwork(isZeko).then();
    }
    const intervalID = setInterval(() => {
      if (mina && zkState) {
        getUserInformation(mina).then(x => setInformation(x))
      }
    }, 15000);

    return () => clearInterval(intervalID);
  }, [mina, isZeko]);


  const getUserInformation = async (auroMina) => {
    try {
      const accounts = await auroMina?.getAccounts();
      console.log("accounts");
      const account = accounts?.length ? accounts[0] : "";
      const newtwork = await auroMina?.requestNetwork();
      console.log("newtwork", newtwork);
      const balances = await zkState?.zkappWorkerClient?.getBalances(account);
      const mina = parseInt(balances.mina) / 10 ** 9;
      const token = parseInt(balances.token) / 10 ** 9;
      const liquidity = parseInt(balances.liquidity) / 10 ** 9;
      return { account, network: newtwork.networkID, mina, token, liquidity };
    } catch (error) {
      console.error("getUserInformation", error);
    }
  }

  useEffect(() => {

    switchNetwork(network === "zeko").then();

  }, [network])

  const switchNetwork = async (zeko: boolean) => {
    try {
      if (zeko) {
        await zkState?.zkappWorkerClient?.setActiveInstanceToZeko();
      } else {
        await zkState?.zkappWorkerClient?.setActiveInstanceToDevnet();
      }
      const desiredNetwork = zeko ? "zeko:testnet" : "mina:testnet";
      const network = await mina?.requestNetwork();
      if (network != desiredNetwork) {
        await mina?.switchChain({ networkID: desiredNetwork }).catch((err: any) => console.error(err));
      }
      setInformation({ ...information });
      setIsZeko(zeko);
    } catch (error) {
      console.error("getUserInformation", error);
    }
  }

  const trimText = (text: string) => {
    return text.substring(0, 4) + "..." + text.substring(text.length - 4, text.length);
  }

  return (
    <>
      <div className="flex flex-row justify-between items-center w-screen menu" style={{ position: "fixed", top: "0", left: "0", backgroundColor: "white" }} >
        {/* <div>
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
        </div> */}

        <div>
          <img className="w-52 h-12" src="/assets/logo/logo.png" />
        </div>
        <div>

        </div>
        <div className="flex flex-row">

          <div>
            <span>{Math.trunc(information.mina)} Mina</span>
          </div>
          <div>
            <span title="Token">{Math.trunc(information.token)} TOKA</span>
          </div>
          <div>
            <span title="Liquidity">{Math.trunc(information.liquidity)} LUM</span>
          </div>
          <div>
            <span title={information.account}>{trimText(information.account)}</span>
          </div>
          <div>
            <select defaultValue={network} onChange={(ev) => setNetwork(ev.target.value)}>
              <option value="zeko">Zeko</option>
              <option value="devnet">Devnet</option>
            </select>
          </div>
        </div>
      </div>
    </>
  );
};

export default Account;
