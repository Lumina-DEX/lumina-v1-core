import { FungibleToken, FungibleTokenAdmin, PoolFactory, Pool, PoolTokenHolder } from '../index.js';

// node build/src/utils/verificationKey.js


// get contract vk
await PoolFactory.compile();
const poolKey = await Pool.compile();
await FungibleToken.compile();
await FungibleTokenAdmin.compile();
const poolTokenHolderKey = await PoolTokenHolder.compile();
// const poolUpgradeTest = await PoolUpgradeTest.compile();

console.log("pool key", poolKey.verificationKey.data);
console.log("pool key hash", poolKey.verificationKey.hash.toBigInt());
console.log("pool token holder", poolTokenHolderKey.verificationKey.data);
console.log("pool token holder hash", poolTokenHolderKey.verificationKey.hash.toBigInt());
// console.log("poolUpgradeTest", poolUpgradeTest.verificationKey.data);
// console.log("poolUpgradeTest hash", poolUpgradeTest.verificationKey.hash.toBigInt());