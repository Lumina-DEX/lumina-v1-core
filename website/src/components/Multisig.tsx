"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useSearchParams } from "next/navigation";
import { Bool, Mina, PublicKey, Sign, Signature, UInt64 } from "o1js";
import Loading from "./Loading";
import { SignatureRight, UpdateAccountInfo } from "../../../contracts/build/src/index";


// @ts-ignore
const Multisig = ({ accountState }) => {

  const [mina, setMina] = useState<any>();

  const [signers, setSigners] = useState({
    signer1Address: "B62qipa4xp6pQKqAm5qoviGoHyKaurHvLZiWf3djDNgrzdERm6AowSQ",
    signer1Signature: "",
    signer2Address: "B62qkjzL662Z5QD16cB9j6Q5TH74y42ALsMhAiyrwWvWwWV1ypfcV65",
    signer2Signature: "",
    signer3Address: "B62qpLxXFg4rmhce762uiJjNRnp5Bzc9PnCEAcraeaMkVWkPi7kgsWV",
    signer3Signature: "",
  });


  const allRight = new SignatureRight(Bool(true), Bool(true), Bool(true), Bool(true), Bool(true), Bool(true));

  const [multisigInfo, setMultisigInfo] = useState({
    poolFactory: "B62qp6x4PfXbqhL3rWgshwkfS2sHTzPDYWBmgTxBsBGSPihJaNEEUXv",
    oldDelegator: "B62qmibKL59uByUjbWmXYBPLhhs5GbUYSBWGThsEqkHkdNcU7FCdfYy",
    newDelegator: "B62qipa4xp6pQKqAm5qoviGoHyKaurHvLZiWf3djDNgrzdERm6AowSQ",
    right: allRight,
    deadline: new Date(2025, 6, 30)
  });

  const [signature, setSignature] = useState("");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (window && (window as any).mina) {
      setMina((window as any).mina);
    }

  }, [])

  const zkState = accountState;

  const sign = async () => {
    setLoading(true);
    try {
      const slot = getSlotFromTimestamp(multisigInfo.deadline.getTime());
      const info = new UpdateAccountInfo({ oldUser: PublicKey.fromBase58(multisigInfo.oldDelegator), newUser: PublicKey.fromBase58(multisigInfo.newDelegator), deadlineSlot: slot });
      const fields = info.toFields();
      const signUser = await mina.signFields({ message: fields.map(f => f.toString()) }).catch((err: any) => { throw err });;
      console.log('signUser', signUser);
      setSignature(signUser.signature);
    }
    catch (error) {
      console.log('sign error', error);
    }
    finally {
      setLoading(false);
    }
  }

  function getSlotFromTimestamp(date: number) {
    const { genesisTimestamp, slotTime } = Mina.activeInstance.getNetworkConstants();
    let slotCalculated = UInt64.from(date);
    slotCalculated = (slotCalculated.sub(genesisTimestamp)).div(slotTime);
    return slotCalculated.toUInt32();
  }

  return (
    <>
      <div className="flex flex-row justify-center w-full ">
        <div className="flex flex-col p-5 gap-5  items-center">
          <div className="text-xl">
            Multisig
          </div>
          <div>
            <span className="font-light">Old delegator: </span><input type="text" className="pl-3" defaultValue={multisigInfo.oldDelegator} onChange={(event) => setMultisigInfo({ ...multisigInfo, oldDelegator: event.target.value })}></input>
          </div>
          <div>
            <span className="font-light">New delegator: </span><input type="text" className="pl-3" defaultValue={multisigInfo.newDelegator} onChange={(event) => setMultisigInfo({ ...multisigInfo, oldDelegator: event.target.value })}></input>
          </div>
          <div className="flex flex-row items-start">
            <span className="font-light">Signature: </span><textarea className="pl-3" value={signature} cols={25} disabled rows={5}></textarea>
          </div>

          <div>
            <span className="font-light">Signer1: </span>
            <div className="flex flex-column">
              <input type="text" className="pl-3" value={signers.signer1Address} disabled></input>
              <input type="text" className="pl-3" defaultValue={signers.signer1Signature} onChange={(event) => setSigners({ ...signers, signer1Signature: event.target.value })}></input>
            </div>
          </div>
            <div>
            <span className="font-light">Signer2: </span>
            <div className="flex flex-column">
              <input type="text" className="pl-3" value={signers.signer2Address} disabled></input>
              <input type="text" className="pl-3" defaultValue={signers.signer2Signature} onChange={(event) => setSigners({ ...signers, signer2Signature: event.target.value })}></input>
            </div>
          </div>
              <div>
            <span className="font-light">Signer3: </span>
            <div className="flex flex-column">
              <input type="text" className="pl-3" value={signers.signer3Address} disabled></input>
              <input type="text" className="pl-3" defaultValue={signers.signer3Signature} onChange={(event) => setSigners({ ...signers, signer3Signature: event.target.value })}></input>
            </div>
          </div>

          <button onClick={sign} className="w-full bg-cyan-500 text-lg text-white p-1 rounded">
            Sign
          </button>
          {loading && <div className="flex flex-row items-center"><Loading></Loading> <span className="ml-3">Creating transaction ...</span></div>}
        </div>
      </div>
    </>
  );
};

export default Multisig;
