import fs from 'fs/promises';
import { AccountUpdate, Bool, Cache, fetchAccount, Field, Mina, NetworkId, PrivateKey, PublicKey, SmartContract, UInt64, UInt8 } from 'o1js';
import { PoolMina, PoolTokenHolder, FungibleToken, FungibleTokenAdmin, mulDiv, Faucet, PoolFactory, PoolData } from './indexmina.js';
import readline from "readline/promises";
import path from 'path';

// node build/src/verificationKey.js


// get contract vk
await PoolData.compile();
await PoolFactory.compile();
const poolKey = await PoolMina.compile();
await FungibleToken.compile();
await FungibleTokenAdmin.compile();
const poolHolderKey = await PoolTokenHolder.compile();

console.log("poolKey", poolKey);
console.log("poolHolderKey", poolHolderKey);
console.log("poolKey hash", poolKey.verificationKey.hash.toBigInt());
console.log("poolHolderKey hash", poolHolderKey.verificationKey.hash.toBigInt());
// console.log("poolKey hash string", poolKey.verificationKey.hash.toString());

// const testHash = Field("27869273158675798351694849109960400575836124893377122482851082053344555026095");
// console.log("testHash", testHash.toBigInt());