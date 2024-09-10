"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useSearchParams } from "next/navigation";
import { PublicKey } from "o1js";
// @ts-ignore
import CurrencyFormat from "react-currency-format";
import Liquidity from "./Liquidity";
import Swap from "./Swap";
import Withdraw from "./Withdraw";
import Faucet from "./Claim";

type Percent = number | string;

// @ts-ignore
const Tab = ({ accountState }) => {

    const [tab, setTab] = useState<any>("swap");

    return (
        <>
            <div>
                <div className="flex flex-col  w-[400px]  h-[500px]  rounded" style={{ backgroundColor: "rgb(255, 245, 240)" }}>
                    <div className="flex flex-row justify-around items-stretch w-full p-2" style={{ borderBottom: "white 1px solid" }} >
                        <button style={{ color: tab === "swap" ? "blue" : "black" }} className="text-lg text-black p-1 " onClick={() => setTab("swap")}>Swap</button>
                        <button style={{ color: tab === "liquidity" ? "blue" : "black" }} className="text-lg text-black p-1 " onClick={() => setTab("liquidity")}>Liquidity</button>
                        <button style={{ color: tab === "withdraw" ? "blue" : "black" }} className="text-lg text-black p-1 " onClick={() => setTab("withdraw")}>Withdraw</button>
                        <button style={{ color: tab === "faucet" ? "blue" : "black" }} className="text-lg text-black p-1 " onClick={() => setTab("faucet")}>Faucet</button>
                    </div>
                    <div className="p-2">
                        {tab === "swap" && <div>
                            <Swap accountState={accountState}></Swap>
                        </div>
                        }
                        {tab === "liquidity" && <div>
                            <Liquidity accountState={accountState}></Liquidity>
                        </div>}
                        {tab === "withdraw" && <div>
                            <Withdraw accountState={accountState}></Withdraw>
                        </div>}
                        {tab === "faucet" && <div>
                            <Faucet accountState={accountState}></Faucet>
                        </div>}
                    </div>
                </div>
            </div>
        </>
    );
};

export default Tab;
