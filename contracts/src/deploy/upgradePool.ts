/**
 * This script can be used to interact with the Add contract, after deploying it.
 *
 * We call the update() method on the contract, create a proof and send it to the chain.
 * The endpoint that we interact with is read from your config.json.
 *
 * This simulates a user interacting with the zkApp from a browser, except that here, sending the transaction happens
 * from the script and we're using your pre-funded zkApp account to pay the transaction fee. In a real web app, the user's wallet
 * would send the transaction and pay the fee.
 *
 * To run locally:
 * Build the project: `$ npm run build`
 * Run with node:     `$ node build/src/deploy.js`.
 */
import { Cache, fetchAccount, Mina, PrivateKey, PublicKey } from 'o1js';
import { PoolTokenHolder, FungibleToken, FungibleTokenAdmin, PoolFactory, Pool } from '../index.js';
import readline from "readline/promises";
import { PoolV1 } from '../pool/Poolv1.js';
import { PoolTokenHolderV1 } from '../pool/PoolTokenHolderv1.js';
import { PoolV2 } from '../pool/Poolv2.js';

const prompt = async (message: string) => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    const answer = await rl.question(message);

    rl.close(); // stop listening
    return answer;
};

// check command line arg
let deployAlias = "poolmina";
if (!deployAlias)
    throw Error(`Missing <deployAlias> argument.

Usage:
node build/src/deploy/upgradePool.js
`);
Error.stackTraceLimit = 1000;

let feepayerKey = PrivateKey.fromBase58(process.env.FEE_PAYER!);
let zkFactoryKey = PrivateKey.fromBase58(process.env.FACTORY!);

// set up Mina instance and contract we interact with
const Network = Mina.Network({
    // We need to default to the testnet networkId if none is specified for this deploy alias in config.json
    // This is to ensure the backward compatibility.
    networkId: "testnet",
    mina: process.env.GRAPHQL!,
    archive: process.env.ARCHIVE!,
});
console.log("network", process.env.GRAPHQL);
// const Network = Mina.Network(config.url);
const fee = Number(process.env.FEE) * 1e9; // in nanomina (1 billion = 1.0 mina)
Mina.setActiveInstance(Network);
let feepayerAddress = feepayerKey.toPublicKey();
let zkFactoryAddress = zkFactoryKey.toPublicKey();
let zkFactory = new PoolFactory(zkFactoryAddress);

console.log("factory", zkFactoryKey.toBase58());

// compile the contract to create prover keys
console.log('compile the contract...');

const cache: Cache = Cache.FileSystem('./cache');
const keyPoolLatest = await Pool.compile({ cache });
await FungibleToken.compile({ cache });
await FungibleTokenAdmin.compile({ cache });
const keyPoolHolderLatest = await PoolTokenHolder.compile({ cache });
const factoryKey = await PoolFactory.compile({ cache });
await PoolV1.compile({ cache });
await PoolV2.compile({ cache });
await PoolTokenHolderV1.compile({ cache });

async function ask() {
    try {
        const result = await prompt(`Set pool address to upgrade`);
        await upgradePool(result);

    } catch (error) {
        await ask();
    }
    finally {
        await ask();
    }
}

await ask();


async function upgradePool(poolAddressStr: string) {
    try {
        console.log("upgrade pool");
        const ownerKey = PrivateKey.fromBase58(process.env.OWNER!);
        await fetchAccount({ publicKey: ownerKey.toPublicKey() })
        const poolAddress = PublicKey.fromBase58(poolAddressStr);
        const zkPool = new PoolV1(poolAddress);
        const tokenAddress = await zkPool.token1.fetch();
        const zkToken = new FungibleToken(tokenAddress!);
        const zkHolder = new PoolTokenHolderV1(poolAddress, zkToken.deriveTokenId())

        let tx = await Mina.transaction({ sender: feepayerAddress, fee }, async () => {
            await zkPool.updateVerificationKey(keyPoolLatest.verificationKey)
            await zkHolder.updateVerificationKey(keyPoolHolderLatest.verificationKey)
            await zkToken.approveAccountUpdate(zkHolder.self);
        });
        console.log("upgrade  proof", tx.toPretty());
        await tx.prove();
        let sentTx = await tx.sign([feepayerKey, ownerKey]).send();
        if (sentTx.status === 'pending') {
            console.log("hash", sentTx.hash);
        }

    } catch (err) {
        console.log(err);
    }
}
