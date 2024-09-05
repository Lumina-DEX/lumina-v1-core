"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useSearchParams } from "next/navigation";
import { PublicKey } from "o1js";
// @ts-ignore
import CurrencyFormat from "react-currency-format";
import Liquidity from "./Liquidity";
import Swap from "./Swap";

type Percent = number | string;

// @ts-ignore
const Tab = ({ accountState }) => {

    const [tab, setTab] = useState<any>("swap");

    return (
        <>
            <div>
                <div className="flex flex-col  w-[400px]  h-[400px]  rounded" style={{ backgroundColor: "rgb(255, 245, 240)" }}>
                    <div className="flex flex-row justify-around items-stretch w-full p-2" style={{ borderBottom: "white 1px solid" }} >
                        <button style={{ textDecoration: tab === "swap" ? "underline" : "none" }} className="text-lg text-black p-1 " onClick={() => setTab("swap")}>Swap</button>
                        <button style={{ textDecoration: tab === "liquidity" ? "underline" : "none" }} className="text-lg text-black p-1 " onClick={() => setTab("liquidity")}>Liquidity</button>
                    </div>
                    <div className="p-2">
                        {tab === "swap" && <div>
                            <Swap accountState={accountState}></Swap>
                        </div>
                        }
                        {tab === "liquidity" && <div>
                            <Liquidity accountState={accountState}></Liquidity>
                        </div>}
                    </div>
                </div>
            </div>
        </>
    );
};

export default Tab;
