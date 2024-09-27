import { SandboxedJob } from 'bullmq';
import { Account, AccountUpdate, Bool, Cache, Mina, PrivateKey, PublicKey, UInt32, UInt64, fetchAccount } from "o1js";
import { PoolMina, PoolTokenHolder, FungibleToken, FungibleTokenAdmin } from "../dist/src/contracts/indexmina.js";


export default async (job: SandboxedJob) => {

    const Network = Mina.Network({
        networkId: "testnet",
        mina: "https://api.minascan.io/node/devnet/v1/graphql"
    });
    Mina.setActiveInstance(Network);

    console.time("compile");
    //const cacheFiles = await fetchFromServerFiles();
    const cache = Cache.FileSystem("./cache");
    console.log("compile pool mina");
    await PoolMina.compile({ cache })
    console.log("compile pool token holder");
    await PoolTokenHolder.compile({ cache });
    console.log("compile pool token admin");
    await FungibleTokenAdmin.compile({ cache });
    console.log("compile pool fungible token");
    await FungibleToken.compile({ cache });
    console.timeEnd("compile");

    // Do something with job
    const poolKey = PublicKey.fromBase58("B62qjmz2oEe8ooqBmvj3a6fAbemfhk61rjxTYmUMP9A6LPdsBLmRAxK");

    console.log("fetch");
    const acc = await fetchAccount({ publicKey: poolKey });
    console.log("acc", acc.account.balance.toBigInt());

    console.log("pool");
    const pool = new PoolMina(poolKey)
    const token = await pool.token.getAndRequireEquals();
    console.log("token", token.toBase58());

    const frontend = PublicKey.fromBase58("B62qoSZbMLJSP7dHLqe8spFPFSsUoENnMSHJN8i5bS1X4tdGpAZuwAC");

    console.time("prove");
    let amt = UInt64.from(10 * 10 ** 9);
    let amtToken = UInt64.from(50 * 10 ** 9);
    let txn = await Mina.transaction(frontend, async () => {
        AccountUpdate.fundNewAccount(frontend, 2);
        await pool.supplyFirstLiquidities(amt, amtToken);
    });

    const tx = await txn.prove();
    console.timeEnd("prove");

    return { token: token.toBase58(), transaction: tx.toJSON() };

};