"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Addresses } from "@/utils/addresses";
import useAccount from "@/states/useAccount";

const TokenMenu = ({ pool, setPool }) => {

  const [tokenList, setTokenList] = useState([]);
  const accountState = useAccount();

  useEffect(() => {
    console.log("token", pool);
    console.log("accountState update");
    Addresses.getList().then((x: any) => {
      const network = accountState.network === "mina:testnet" ? "mina-devnet" : "zeko-devnet";
      const tokens = x?.tokens?.filter(z => z.chainId === network);
      setTokenList(tokens)
    });
  }, [accountState.network])

  return (<select className="ml-3" value={pool} onChange={async (ev) => await setPool(ev.target.value)}>
    {tokenList.map(x => <option key={x.poolAddress} title={x.name} value={x.poolAddress}>{x.symbol}</option>)}
  </select>);
};

export default TokenMenu;
