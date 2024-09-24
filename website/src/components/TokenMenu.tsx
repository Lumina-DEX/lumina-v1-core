"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Addresses } from "@/utils/addresses";

const TokenMenu = ({ token, setToken }) => {

  const [tokenList, setTokenList] = useState([]);
  useEffect(() => {
    Addresses.getList().then((x: any) => {
      const tokens = x?.tokens?.filter(z => z.chainId === "mina-devnet");
      setTokenList(tokens)
    });
  }, [])

  return (<select className="ml-3" defaultValue={token} onChange={async (ev) => await setToken(ev.target.value)}>
    {tokenList.map(x => <option key={x.poolAddress} title={x.name} value={x.poolAddress}>{x.symbol}</option>)}
  </select>);
};

export default TokenMenu;
