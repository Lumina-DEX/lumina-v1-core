"use client";
import React, { useEffect, useMemo, useState } from "react";
import useAccount from "@/states/useAccount";
import Multisig from "@/components/Multisig";

type Percent = number | string;

// @ts-ignore
const MultisigPage = () => {

    const [tab, setTab] = useState<any>("multisig");
    const accountState = useAccount();

    return (
        <>
            <div className="flex flex-col min-w-[360px]  w-screen  max-w-[800px] h-[650px] rounded" style={{ backgroundColor: "rgb(255, 245, 240)" }}>
                <div className="p-2">
                    {tab === "multisig" && <div>
                        <Multisig accountState={accountState}></Multisig>
                    </div>
                    }
                </div>
            </div>
        </>
    );
};

export default MultisigPage;
