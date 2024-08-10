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
import fs from 'fs/promises';
import { AccountUpdate, Field, Mina, NetworkId, PrivateKey, PublicKey, UInt64 } from 'o1js';
import { PoolMina, MinaTokenHolder, TokenStandard, TokenA, PoolMinaDeployProps } from '../index.js';
import readline from "readline/promises";

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
node build/src/deploy/deployAll.js
`);
Error.stackTraceLimit = 1000;
const DEFAULT_NETWORK_ID = 'zeko';

// parse config and private key from file
type Config = {
    deployAliases: Record<
        string,
        {
            networkId?: string;
            url: string;
            keyPath: string;
            fee: string;
            feepayerKeyPath: string;
            feepayerAlias: string;
        }
    >;
};
let configJson: Config = JSON.parse(await fs.readFile('config.json', 'utf8'));
let config = configJson.deployAliases[deployAlias];
let feepayerKeysBase58: { privateKey: string; publicKey: string } = JSON.parse(
    await fs.readFile(config.feepayerKeyPath, 'utf8'));

let feepayerKey = PrivateKey.fromBase58(feepayerKeysBase58.privateKey);
let zkAppKey = PrivateKey.fromBase58("EKFM9yi3LtS5orvfNnjJ393FHZXoob3r24SyaVTFwYH4qCWeHfY6");
let zkToken0PrivateKey = PrivateKey.fromBase58("EKDsrdPUQRi4r25sDRTf5WxKnCgdEXNb4VDu65seg9Qw926aN1Re");

// set up Mina instance and contract we interact with
const Network = Mina.Network({
    // We need to default to the testnet networkId if none is specified for this deploy alias in config.json
    // This is to ensure the backward compatibility.
    networkId: (config.networkId ?? DEFAULT_NETWORK_ID) as NetworkId,
    mina: "https://api.minascan.io/node/devnet/v1/graphql",
    archive: 'https://api.minascan.io/archive/devnet/v1/graphql',
});
console.log("network", config.url);
// const Network = Mina.Network(config.url);
const fee = Number(config.fee) * 1e9; // in nanomina (1 billion = 1.0 mina)
Mina.setActiveInstance(Network);
let feepayerAddress = feepayerKey.toPublicKey();
let zkAppAddress = zkAppKey.toPublicKey();
let zkApp = new PoolMina(zkAppAddress);
let zkToken0Address = zkToken0PrivateKey.toPublicKey();
let zkToken0 = new TokenStandard(zkToken0Address);

console.log("tokenStandard", zkToken0Address.toBase58());
console.log("tokenStandard", zkToken0PrivateKey.toBase58());
console.log("pool", zkAppKey.toBase58());
console.log("pool", zkAppAddress.toBase58());

// compile the contract to create prover keys
console.log('compile the contract...');

await PoolMina.compile();
await TokenStandard.compile();
await MinaTokenHolder.compile();

async function ask() {
    try {
        const result = await
            prompt(`Why do you want to do ?
            1 deploy token
            2 deploy pool      
            3 deploy token holder 
            4 add liquidity 
            5 swap mina for token
            6 swap token for mina`);
        switch (result) {
            case "1":
                await deployToken();
                break;
            case "2":
                await deployPool();
                break;
            case "3":
                await deployTokenHolder();
                break;
            case "4":
                await addLiquidity();
                break;
            case "5":
                await swapMina();
                break;
            case "6":
                await swapToken();
                break;
            default:
                await ask();
                break;
        }
    } catch (error) {
        await ask();
    }
    finally {
        await ask();
    }
}

await ask();

async function deployToken() {
    try {
        console.log("deploy token standard");

        let tx = await Mina.transaction(
            { sender: feepayerAddress, fee },
            async () => {
                AccountUpdate.fundNewAccount(feepayerAddress, 2);
                await zkToken0.deploy();
            }
        );
        await tx.prove();
        let sentTx = await tx.sign([feepayerKey, zkToken0PrivateKey]).send();
        if (sentTx.status === 'pending') {
            console.log("hash", sentTx.hash);
        }


    } catch (err) {
        console.log(err);
    }
}

async function deployPool() {
    try {
        console.log("deploy pool");
        const args: PoolMinaDeployProps = { tokenA: zkToken0Address };
        let tx = await Mina.transaction(
            { sender: feepayerAddress, fee },
            async () => {
                AccountUpdate.fundNewAccount(feepayerAddress, 1);
                await zkApp.deploy(args);
            }
        );
        await tx.prove();
        let sentTx = await tx.sign([feepayerKey, zkAppKey]).send();
        if (sentTx.status === 'pending') {
            console.log("hash", sentTx.hash);
        }


    } catch (err) {
        console.log(err);
    }
}


async function deployTokenHolder() {
    try {
        console.log("deploy token holder");
        let dexTokenHolder0 = new MinaTokenHolder(zkAppAddress, zkToken0.deriveTokenId());
        let tx = await Mina.transaction(
            { sender: feepayerAddress, fee },
            async () => {
                AccountUpdate.fundNewAccount(feepayerAddress, 1);
                await dexTokenHolder0.deploy();
                await zkToken0.approveAccountUpdate(dexTokenHolder0.self);
            }
        );
        await tx.prove();
        let sentTx = await tx.sign([feepayerKey, zkAppKey, zkToken0PrivateKey]).send();
        if (sentTx.status === 'pending') {
            console.log("hash", sentTx.hash);
        }


    } catch (err) {
        console.log(err);
    }
}


async function addLiquidity() {
    try {
        console.log("add liquidity");
        let amt = UInt64.from(5000 * 10 ** 9);
        let amtMina = UInt64.from(12 * 10 ** 9);
        let tx = await Mina.transaction({ sender: feepayerAddress, fee }, async () => {
            AccountUpdate.fundNewAccount(feepayerAddress, 1);
            await zkApp.supplyFirstLiquidities(amt, amtMina);
        });
        await tx.prove();
        let sentTx = await tx.sign([feepayerKey]).send();
        if (sentTx.status === 'pending') {
            console.log("hash", sentTx.hash);
        }


    } catch (err) {
        console.log(err);
    }
}

async function swapMina() {
    try {
        console.log("swap Mina");
        let amtSwap = UInt64.from(220_000);
        let tx = await Mina.transaction({ sender: feepayerAddress, fee }, async () => {
            await zkApp.swapFromMina(amtSwap, UInt64.from(1000));
        });
        await tx.prove();
        let sentTx = await tx.sign([feepayerKey]).send();
        if (sentTx.status === 'pending') {
            console.log("hash", sentTx.hash);
        }

    } catch (err) {
        console.log(err);
    }
}

async function swapToken() {
    try {
        console.log("swap Token");
        let amtSwap = UInt64.from(3_220_000);
        let tx = await Mina.transaction({ sender: feepayerAddress, fee }, async () => {
            await zkApp.swapFromMina(amtSwap, UInt64.from(1000));
        });
        await tx.prove();
        let sentTx = await tx.sign([feepayerKey]).send();
        if (sentTx.status === 'pending') {
            console.log("hash", sentTx.hash);
        }

    } catch (err) {
        console.log(err);
    }
}


function sleep() {
    return new Promise(resolve => setTimeout(resolve, 20000));
}


function getTxnUrl(graphQlUrl: string, txnHash: string | undefined) {
    const hostName = new URL(graphQlUrl).hostname;
    const txnBroadcastServiceName = hostName
        .split('.')
        .filter((item) => item === 'minascan')?.[0];
    const networkName = graphQlUrl
        .split('/')
        .filter((item) => item === 'mainnet' || item === 'devnet')?.[0];
    if (txnBroadcastServiceName && networkName) {
        return `https://minascan.io/${networkName}/tx/${txnHash}?type=zk-tx`;
    }
    return `Transaction hash: ${txnHash}`;
}
