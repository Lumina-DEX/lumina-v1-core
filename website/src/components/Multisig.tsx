"use client";
import React, { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useSearchParams } from "next/navigation";
import { Bool, Mina, Provable, PublicKey, Sign, Signature, UInt64 } from "o1js";
import Loading from "./Loading";
import { SignatureRight, UpdateAccountInfo } from "../../../contracts/build/src/index";


// @ts-ignore
const Multisig = ({ accountState }) => {

  const [mina, setMina] = useState<any>();

  useEffect(() => {
    accountState.zkappWorkerClient.getDelegator()
      .then((delegator) => { setMultisigInfo({ ...multisigInfo, oldDelegator: delegator }) }).catch((err) => {
        console.error("Error fetching delegator:", err);
      });
  },[]);

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

  const updateDelegator = async () => {
    setLoading(true);
    try {
      if (mina) {
        const slot = getSlotFromTimestamp(multisigInfo.deadline.getTime());
        Provable.log("slot", slot);
        const info = new UpdateAccountInfo({ oldUser: PublicKey.fromBase58(multisigInfo.oldDelegator), newUser: PublicKey.fromBase58(multisigInfo.newDelegator), deadlineSlot: slot });
        const fields = info.toFields();
        console.time("create");
        console.log("zkState", zkState)
        const user: string = (await mina.requestAccounts())[0];
        await zkState.zkappWorkerClient?.setNewDelegator(user, multisigInfo.oldDelegator, multisigInfo.newDelegator, Number(slot),
          signers.signer1Address, signers.signer1Signature, signers.signer2Address, signers.signer2Signature, signers.signer3Address, signers.signer3Signature);
        const json = await zkState.zkappWorkerClient?.getTransactionJSON();
        console.timeEnd("create");
        await mina.sendTransaction({ transaction: json });
      }
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
      <div className="flex flex-row justify-start w-full ">
        <div className="flex flex-col p-5 gap-5 w-full items-center">
          <div className="text-xl">
            Multisig
          </div>
          <div className="flex flex-row justify-between w-full ">
            <span className="font-light">Current delegator: </span><input type="text" className="pl-3 w-4/5" defaultValue={multisigInfo.oldDelegator} onChange={(event) => setMultisigInfo({ ...multisigInfo, oldDelegator: event.target.value })}></input>
          </div>
          <div className="flex flex-row justify-between w-full ">
            <span className="font-light">New delegator: </span><input type="text" className="pl-3 w-4/5" defaultValue={multisigInfo.newDelegator} onChange={(event) => setMultisigInfo({ ...multisigInfo, oldDelegator: event.target.value })}></input>
          </div>
          <div className="flex flex-row justify-between w-full ">
            <span className="font-light">Deadline: </span><input type="text" className="pl-3 w-4/5" value={multisigInfo.deadline.toUTCString()} readOnly></input>
          </div>
          <div className="flex flex-row justify-between w-full ">
            <span className="font-light">Signature: </span>
            <input type="text" className="pl-3 w-4/5" value={signature} readOnly></input>
          </div>
          <button onClick={sign} className="w-full bg-cyan-500 text-lg text-white p-1 rounded">
            Sign
          </button>
          <div className="flex flex-row justify-between items-center w-full ">
            <span className="font-light">Signer1: </span>
            <div className="flex flex-col  items-end  w-5/6">
              <input type="text" className="pl-3 w-full" value={signers.signer1Address} readOnly></input>
              <input type="text" placeholder="signature" className="pl-3 w-full mt-1" defaultValue={signers.signer1Signature} onChange={(event) => setSigners({ ...signers, signer1Signature: event.target.value })}></input>
            </div>
          </div>
          <div className="flex flex-row items-center justify-between w-full ">
            <span className="font-light">Signer2: </span>
            <div className="flex flex-col items-end  w-5/6">
              <input type="text" className="pl-3 w-full" value={signers.signer2Address} readOnly></input>
              <input type="text" placeholder="signature" className="pl-3 w-full mt-1" defaultValue={signers.signer2Signature} onChange={(event) => setSigners({ ...signers, signer2Signature: event.target.value })}></input>
            </div>
          </div>
          <div className="flex flex-row items-center justify-between  w-full ">
            <span className="font-light">Signer3: </span>
            <div className="flex flex-col items-end  w-5/6">
              <input type="text" className="pl-3 w-full" value={signers.signer3Address} readOnly></input>
              <input type="text" placeholder="signature" className="pl-3 w-full mt-1" defaultValue={signers.signer3Signature} onChange={(event) => setSigners({ ...signers, signer3Signature: event.target.value })}></input>
            </div>
          </div>

          <button onClick={updateDelegator} className="w-full bg-cyan-500 text-lg text-white p-1 rounded">
            Update delegator
          </button>
          {loading && <div className="flex flex-row items-center"><Loading></Loading> <span className="ml-3">Creating transaction ...</span></div>}
        </div>
      </div>
    </>
  );
};

export default Multisig;
