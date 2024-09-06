"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useSearchParams } from "next/navigation";
import { fetchAccount, PublicKey } from "o1js";
// @ts-ignore
import CurrencyFormat from "react-currency-format";

// @ts-ignore
const Account = ({ accountState }) => {
  const [mina, setMina] = useState<any>();
  const [information, setInformation] = useState<any>({ account: "", network: "" });
  const [balances, setBalances] = useState<any>({ mina: 0, token: 0, liquidity: 0 });
  const [isZeko, setIsZeko] = useState(true);
  const [network, setNetwork] = useState("zeko");
  const zekoGraph = "https://devnet.zeko.io/graphql";
  const devnetGraph = "https://api.minascan.io/node/devnet/v1/graphql";
  const [graph, setGraph] = useState(zekoGraph);

  const zkState = accountState;

  useEffect(() => {
    if (window && (window as any).mina) {
      setMina((window as any).mina);
    }

    const intervalID = setInterval(() => {
      if (mina) {
        getUserInformation(mina).then(x => setInformation(x))
      }
    }, 15000);

    return () => clearInterval(intervalID);

  }, [])

  useEffect(() => {
    if (mina) {
      getUserInformation(mina).then(x => setInformation(x));
    }
  }, [mina]);

  const getBalances = async (user: string, graphUrl: string) => {
    const publicKey = PublicKey.fromBase58(user);
    const accMina = await fetchAccount({ publicKey }, graphUrl);
    const acc = await fetchAccount({ publicKey, tokenId: "wTRtTRnW7hZCQSVgsuMVJRvnS1xEAbRRMWyaaJPkQsntSNh67n" }, graphUrl);
    const accLiquidity = await fetchAccount({ publicKey, tokenId: "wpmBCWqmBWeYm3vEnwpEQ16LS8AJCAatSrSHsJTxNx4mrLy8NL" }, graphUrl);
    const bal = accMina.account ? accMina.account.balance : 0;
    const balToken = acc.account ? acc.account.balance : 0;
    const balLiquidity = accLiquidity.account ? accLiquidity.account.balance : 0;

    const mina = parseInt(bal.toString()) / 10 ** 9;
    const token = parseInt(balToken.toString()) / 10 ** 9;
    const liquidity = parseInt(balLiquidity.toString()) / 10 ** 9;
    return { mina, token, liquidity };
  }

  const getUserInformation = async (auroMina) => {
    try {
      const accounts = await auroMina?.getAccounts();
      const account = accounts?.length ? accounts[0] : "";
      const network = await auroMina?.requestNetwork();
      console.log("account", account);
      console.log("network", network);

      if (account) {
        const newBalances = await getBalances(account, graph);
        setBalances(newBalances);
      }
      return { account, network: network?.networkID };
    } catch (error) {
      console.error("getUserInformation", error);
    }
  }


  const switchNetwork = useCallback(async (newNetwork: string) => {
    setNetwork(newNetwork);
    const zeko = newNetwork === "zeko";
    try {
      if (zeko) {
        await zkState?.zkappWorkerClient?.setActiveInstanceToZeko();
        setGraph(zekoGraph);
        const newBalances = await getBalances(information?.account, zekoGraph);
        setBalances(newBalances);
      } else {
        await zkState?.zkappWorkerClient?.setActiveInstanceToDevnet();
        setGraph(devnetGraph);
        const newBalances = await getBalances(information?.account, devnetGraph);
        setBalances(newBalances);
      }
      const desiredNetwork = zeko ? "zeko:testnet" : "mina:testnet";
      const network = await mina?.requestNetwork();
      if (network != desiredNetwork) {
        await mina?.switchChain({ networkID: desiredNetwork }).catch((err: any) => console.error(err));
      }
      setIsZeko(zeko);

    } catch (error) {
      console.error("getUserInformation", error);
    }
  }, [zekoGraph, information, network,])

  const trimText = (text: string) => {
    if (!text) {
      return "";
    }
    return text.substring(0, 4) + "..." + text.substring(text.length - 4, text.length);
  }

  const connect = async () => {
    if (mina) {
      await mina.requestAccounts();
      const info = await getUserInformation(mina);
      setInformation(info);
    }
  }

  return (
    <>
      <div className="flex flex-row justify-between items-center w-screen menu" style={{ position: "fixed", top: "0", left: "0", backgroundColor: "white" }} >
        <div>
          <img className="w-52 h-12" src="/assets/logo/logo.png" />
        </div>
        <div>

        </div>
        {information?.account && <div className="flex flex-row">
          <div>
            <span>{Math.trunc(balances?.mina)} Mina</span>
          </div>
          <div>
            <span title="Token">{Math.trunc(balances?.token)} TOKA</span>
          </div>
          <div>
            <span title="Liquidity">{Math.trunc(balances?.liquidity)} LUM</span>
          </div>
          <div>
            <span title={information?.account}>{trimText(information?.account)}</span>
          </div>
          <div>
            <select defaultValue={network} onChange={(ev) => switchNetwork(ev.target.value)}>
              <option value="zeko">Zeko</option>
              <option value="devnet">Devnet</option>
            </select>
          </div>
        </div>}
        {!information?.account &&
          <button onClick={() => connect().then()}>Connect Wallet</button>
        }
      </div>
    </>
  );
};

export default Account;
