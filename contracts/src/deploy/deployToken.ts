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
import { AccountUpdate, fetchAccount, Field, Mina, NetworkId, PrivateKey, PublicKey, UInt64 } from 'o1js';
import { PoolMina, MinaTokenHolder, TokenStandard, TokenA, PoolMinaDeployProps, TokenBalance } from '../index.js';
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
node build/src/deploy/deploytoken.js
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
let zkToken0PrivateKey = PrivateKey.fromBase58("EKDuMUvEQfdibgP9CTDZSxMFQ1ZM4zDmamrnLqf43iusd27U3qxL");

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
let zkToken0Address = zkToken0PrivateKey.toPublicKey();
let zkToken0 = new TokenBalance(zkToken0Address);

console.log("tokenStandard", zkToken0Address.toBase58());
console.log("tokenStandard", zkToken0PrivateKey.toBase58());

// compile the contract to create prover keys
console.log('compile the contract...');

const key = await TokenBalance.compile();

async function ask() {
    try {
        const result = await
            prompt(`Why do you want to do ?
            1 deploy token
            2 mint to      
            3 get balance
            `);
        const parsed = result.split(" ");
        switch (parsed[0]) {
            case "1":
                await deployToken();
                break;
            case "2":
                await mintTo(parsed[1]);
                break;
            case "3":
                await getBalance(parsed[1]);
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
                AccountUpdate.fundNewAccount(feepayerAddress, 1);
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

async function mintTo(address: string) {
    try {
        console.log("mint to : " + address);
        let tx = await Mina.transaction(
            { sender: feepayerAddress, fee },
            async () => {
                AccountUpdate.fundNewAccount(feepayerAddress, 1);
                const nb = Math.trunc((Math.random() * 1000));
                await zkToken0.mintTo(PublicKey.fromBase58(address), UInt64.from(nb * 10 ** 9));
            }
        );
        await tx.prove();
        let sentTx = await tx.sign([feepayerKey]).send();
        if (sentTx.status === 'pending') {
            console.log("hash", sentTx.hash);
        }


    } catch (err) {
        console.log(err);
    }
}


async function getBalance(address: string) {
    try {
        const publicKey = PublicKey.fromBase58(address);
        const tokenId = zkToken0.deriveTokenId();
        await fetchAccount({ publicKey });
        await fetchAccount({ publicKey, tokenId });
        const balanceAccount = Mina.getBalance(publicKey, tokenId);
        console.log("get balance : " + address);
        console.log("tokenId : " + tokenId.toString());
        console.log("balanceAccount : " + balanceAccount.toBigInt());
        const bal = await zkToken0.getBalanceOf(publicKey);

        console.log("balance", bal.toBigInt());
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
