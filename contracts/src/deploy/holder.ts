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
import { TokenA, TokenB, Pool, TokenHolder, TokenStandard } from '../index.js';

// check command line arg
let deployAlias = "pool";
if (!deployAlias)
    throw Error(`Missing <deployAlias> argument.

Usage:
node build/src/addLiquidity.js
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
    await fs.readFile(config.feepayerKeyPath, 'utf8')
);

let zkAppKeysBase58: { privateKey: string; publicKey: string } = JSON.parse(
    await fs.readFile("keys/pool.json", 'utf8'));

let zkAppToken0Base58: { privateKey: string; publicKey: string } = JSON.parse(
    await fs.readFile("keys/tokenA.json", 'utf8'));

let zkAppToken1Base58: { privateKey: string; publicKey: string } = JSON.parse(
    await fs.readFile("keys/tokenB.json", 'utf8'));

let feepayerKey = PrivateKey.fromBase58(feepayerKeysBase58.privateKey);
let zkAppKey = PrivateKey.fromBase58(zkAppKeysBase58.privateKey);
let zkToken0PrivateKey = PrivateKey.fromBase58(zkAppToken0Base58.privateKey);
let zkToken1PrivateKey = PrivateKey.fromBase58(zkAppToken1Base58.privateKey);


// set up Mina instance and contract we interact with
const Network = Mina.Network({
    // We need to default to the testnet networkId if none is specified for this deploy alias in config.json
    // This is to ensure the backward compatibility.
    networkId: (config.networkId ?? DEFAULT_NETWORK_ID) as NetworkId,
    mina: config.url,
});
console.log("network", config.url);
// const Network = Mina.Network(config.url);
const fee = Number(config.fee) * 1e9; // in nanomina (1 billion = 1.0 mina)
Mina.setActiveInstance(Network);
let feepayerAddress = feepayerKey.toPublicKey();
let zkAppAddress = zkAppKey.toPublicKey();
let zkApp = new Pool(zkAppAddress);
let zkToken0Address = zkToken0PrivateKey.toPublicKey();
let zkToken0 = new TokenA(zkToken0Address);
let zkToken1Address = zkToken1PrivateKey.toPublicKey();
let zkToken1 = new TokenB(zkToken1Address);

let dexTokenHolder0 = new TokenHolder(zkAppAddress, zkToken0.deriveTokenId());
let dexTokenHolder1 = new TokenHolder(zkAppAddress, zkToken1.deriveTokenId());

// compile the contract to create prover keys
console.log('compile the contract...');

await TokenStandard.compile();
await TokenA.compile();
await TokenB.compile();
await Pool.compile();
await TokenHolder.compile();

try {
    // call update() and send transaction
    console.log('build transaction and create proof...');
    console.log("dexTokenHolder0", dexTokenHolder0.address.toBase58());
    console.log("dexTokenHolder1", dexTokenHolder1.address.toBase58());
    let tx = await Mina.transaction(
        { sender: feepayerAddress, fee },
        async () => {
            AccountUpdate.fundNewAccount(feepayerAddress, 2);
            await dexTokenHolder0.deploy();
            await dexTokenHolder1.deploy();
            await zkToken0.approveAccountUpdate(dexTokenHolder0.self);
            await zkToken1.approveAccountUpdate(dexTokenHolder1.self);
        }
    );
    await tx.prove();

    console.log('send transaction...');
    const sentTx = await tx.sign([feepayerKey, zkAppKey]).send();
    if (sentTx.status === 'pending') {
        console.log(
            '\nSuccess! Update transaction sent.\n' +
            '\nYour smart contract state will be updated' +
            '\nas soon as the transaction is included in a block:' +
            `\n${getTxnUrl(config.url, sentTx.hash)}`
        );
    }



} catch (err) {
    console.log(err);
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
