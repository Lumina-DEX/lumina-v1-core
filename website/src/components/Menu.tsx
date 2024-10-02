"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useSearchParams } from "next/navigation";
import { fetchAccount, PublicKey } from "o1js";
// @ts-ignore
import CurrencyFormat from "react-currency-format";
import useAccount from "@/states/useAccount";
import { connect, minaTestnet, requestAccounts, switchChain, zekoTestnet } from "@/lib/wallet";
import Link from "next/link";

// @ts-ignore
const Menu = () => {
    const router = useRouter();

    return (
        <>
            <div className="flex flex-row gap-5 justify-between items-center text-xl text-black"  >
                <div className={router.pathname == "/" ? "text-blue-500" : ""}>
                    <Link className="text-xl" href="/">Swap</Link>
                </div>
                <div className={router.pathname == "/pool" ? "text-blue-500" : ""}>
                    <Link className="text-xl" href="/pool">Pool</Link>
                </div>
                <div className={router.pathname == "/faucet" ? "text-blue-500" : ""}>
                    <Link className="" href="/faucet">Faucet</Link>
                </div>
            </div>
        </>
    );
};

export default Menu;
