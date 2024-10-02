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

    return (
        <>
            <div className="flex flex-row gap-5 justify-between items-center"  >
                <div>
                    <Link href="/">Swap</Link>
                </div>
                <div>
                    <Link href="/pool">Pool</Link>
                </div>
                <div>
                    <Link href="/faucet">Faucet</Link>
                </div>
            </div>
        </>
    );
};

export default Menu;
