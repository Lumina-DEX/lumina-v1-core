"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useSearchParams } from "next/navigation";
import { fetchAccount, PublicKey } from "o1js";
// @ts-ignore
import CurrencyFormat from "react-currency-format";
import useAccount from "@/states/useAccount";
import { connect, switchChain } from "@/lib/wallet";

// @ts-ignore
const Account = () => {

  const zekoTestnet = "zeko:testnet";
  const minaTestnet = "mina:testnet";
  const zkState = useAccount();

  async function timeout(seconds: number): Promise<void> {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, seconds * 1000);
    });
  }

  useEffect(() => {
    timeout(1).then(() => {
      connect().then(x => {
        console.log("network", zkState.network);
      });
    });
  }, [])



  const switchNetwork = async (newNetwork: string) => {
    await switchChain(newNetwork).then((x) => {
      if (x == zekoTestnet) {
        zkState.zkappWorkerClient.setActiveInstanceToZeko();
      } else {
        zkState.zkappWorkerClient.setActiveInstanceToDevnet();
      }
    });
  };


  const trimText = (text: string) => {
    if (!text) {
      return "";
    }
    return text.substring(0, 4) + "..." + text.substring(text.length - 4, text.length);
  }

  const handleConnect = async () => {
    connect();
  }

  return (
    <>
      <div className="flex flex-row justify-between items-center w-screen menu" style={{ position: "fixed", top: "0", left: "0", backgroundColor: "white" }} >
        <div>
          <img className="w-52 h-12" src="/assets/logo/logo.png" />
        </div>
        <div>

        </div>

        {zkState?.publicKeyBase58 && <div className="flex flex-row">
          <div>
            <span>{zkState.balances["mina"]?.toFixed(2)} MINA</span>
          </div>
          <div>
            <span title="Token">{zkState.balances["toka"]?.toFixed(2)} TOKA</span>
          </div>
          <div>
            <span title={zkState?.publicKeyBase58}>{trimText(zkState?.publicKeyBase58)}</span>
          </div>
          <div>

            <select value={zkState?.network} onChange={async (ev) => await switchNetwork(ev.target.value)}>
              <option value={zekoTestnet}>Zeko</option>
              <option value={minaTestnet}>Devnet</option>
            </select>
          </div>
        </div>}
        {!zkState?.publicKeyBase58 &&
          <button onClick={() => handleConnect().then()}>Connect Wallet</button>
        }
      </div>
    </>
  );
};

export default Account;
