// import { Account, AccountUpdate, Bool, Cache, Mina, PrivateKey, PublicKey, UInt32, UInt64, fetchAccount } from "o1js";
// import { PoolMina, PoolTokenHolder, FungibleToken, FungibleTokenAdmin } from "../../contracts/build/src/indexmina.js";
// import IORedis from 'ioredis';
// import { Worker } from 'bullmq';

// const connection = new IORedis({ maxRetriesPerRequest: null });

// const Network = Mina.Network({
//     networkId: "testnet",
//     mina: "https://api.minascan.io/node/devnet/v1/graphql"
// });
// Mina.setActiveInstance(Network);

// console.time("compile");
// //const cacheFiles = await fetchFromServerFiles();
// const cache = Cache.FileSystem("./cache");
// console.log("compile pool mina");
// await PoolMina.compile({ cache })
// console.log("compile pool token holder");
// await PoolTokenHolder.compile({ cache });
// console.log("compile pool token admin");
// await FungibleTokenAdmin.compile({ cache });
// console.log("compile pool fungible token");
// await FungibleToken.compile({ cache });
// console.timeEnd("compile");

// new Worker('swapFromMina', async (job: any) => {
//     const poolKey = PublicKey.fromBase58("B62qjmz2oEe8ooqBmvj3a6fAbemfhk61rjxTYmUMP9A6LPdsBLmRAxK");
//     const pool = new PoolMina(poolKey)
//     const token = await pool.token.fetch();

//     return { token: token.toBase58() };

// }, { connection });