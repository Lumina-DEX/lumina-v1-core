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
import { TokenStandard, PoolMina, MinaTokenHolder } from '../index.js';

// check command line arg
let deployAlias = "poolmina";
if (!deployAlias)
    throw Error(`Missing <deployAlias> argument.

Usage:
node build/src/deploy/swaptoken.js
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
    await fs.readFile("keys/poolmina.json", 'utf8'));

let zkAppToken0Base58: { privateKey: string; publicKey: string } = JSON.parse(
    await fs.readFile("keys/tokenstandard.json", 'utf8'));

let feepayerKey = PrivateKey.fromBase58(feepayerKeysBase58.privateKey);
let zkAppKey = PrivateKey.fromBase58(zkAppKeysBase58.privateKey);
let zkToken0PrivateKey = PrivateKey.fromBase58(zkAppToken0Base58.privateKey);


// set up Mina instance and contract we interact with
const Network = Mina.Network({
    // We need to default to the testnet networkId if none is specified for this deploy alias in config.json
    // This is to ensure the backward compatibility.
    networkId: (config.networkId ?? DEFAULT_NETWORK_ID) as NetworkId,
    mina: config.url,
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

// compile the contract to create prover keys
console.log('compile the contract...');
await TokenStandard.compile();
await MinaTokenHolder.compile();
await PoolMina.compile();

try {

    console.log("zkapp", zkApp.address.toBase58());

    let tokenAddress = await zkApp.tokenA.fetch();
    console.log("zkapp token a", tokenAddress?.toBase58());

    await fetchAccount({ publicKey: zkApp.address });

    const reserveIn = zkApp.account.balance.getAndRequireEquals();

    console.log('reserve in', reserveIn.toBigInt());

    let amt = UInt64.from(55 * 10 ** 9);
    const txn = await Mina.transaction({ sender: feepayerAddress, fee }, async () => {
        await zkApp.swapFromToken(amt, UInt64.from(1000));
    });

    console.log("txn", txn.toPretty());
    await txn.prove();

    const sentTx = await txn.sign([feepayerKey]).send();
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
