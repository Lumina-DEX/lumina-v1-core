import { SmartContract, State, PublicKey, UInt64 } from 'snarkyjs';
/**
 * Basic Example
 * See https://docs.minaprotocol.com/zkapps for more info.
 *
 * The Add contract initializes the state variable 'num' to be a Field(1) value by default when deployed.
 * When the 'update' method is called, the Add contract adds Field(2) to its 'num' contract state.
 *
 * This file is safe to delete and replace with your own contract.
 */
export declare class Add extends SmartContract {
    num: State<import("snarkyjs/dist/node/lib/field").Field>;
    init(): void;
    update(): void;
    transferToAddress(from: PublicKey, to: PublicKey, value: UInt64): void;
}
