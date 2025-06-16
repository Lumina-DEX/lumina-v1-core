import { FungibleToken, FungibleTokenAdmin, PoolFactory, Pool, PoolTokenHolder } from '../index.js';
import { PoolFactoryUpgradeTest } from '../tests/PoolFactoryUpgradeTest.js';
import { PoolHolderUpgradeTest } from '../tests/PoolHolderUpgradeTest.js';
import { PoolUpgradeTest } from '../tests/PoolUpgradeTest.js';

// node build/src/utils/testvk.js


// get contract vk
await PoolFactory.compile();
const poolKey = await Pool.compile();
await FungibleToken.compile();
await FungibleTokenAdmin.compile();
const poolTokenHolderKey = await PoolTokenHolder.compile();
const poolUpgradeTest = await PoolUpgradeTest.compile();
const poolTokenHolderUpgradeTest = await PoolHolderUpgradeTest.compile();
const poolFactoryUpgradeTest = await PoolFactoryUpgradeTest.compile();


console.log("poolUpgradeTest", poolUpgradeTest.verificationKey.data);
console.log("poolUpgradeTest hash", poolUpgradeTest.verificationKey.hash.toBigInt());
console.log("poolTokenHolderUpgradeTest", poolTokenHolderUpgradeTest.verificationKey.data);
console.log("poolTokenHolderUpgradeTest hash", poolTokenHolderUpgradeTest.verificationKey.hash.toBigInt());
console.log("poolFactoryUpgradeTest", poolFactoryUpgradeTest.verificationKey.data);
console.log("poolFactoryUpgradeTest hash", poolFactoryUpgradeTest.verificationKey.hash.toBigInt());