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
import { TokenA, TokenStandard, ShowBalance } from '../index.js';

// check command line arg
let deployAlias = "showbalance";
if (!deployAlias)
    throw Error(`Missing <deployAlias> argument.

Usage:
node build/src/deploy/getBalance.js
`);
Error.stackTraceLimit = 1000;

const graphQlUrl = "https://api.minascan.io/node/devnet/v1/graphql";

const Network = Mina.Network({
    networkId: 'testnet',
    mina: graphQlUrl
});
console.log("network", graphQlUrl);
Mina.setActiveInstance(Network);
let zkAppAddress = PublicKey.fromBase58("B62qram7TfkH5r99zsWtd2wgj55fHM9fU7yZCE9G94h3knUvzxU3Q6Y");
let zkApp = new ShowBalance(zkAppAddress);

// compile the contract to create prover keys
console.log('compile the contract...');
await ShowBalance.compile();
await TokenStandard.compile();

try {
    const account = PublicKey.fromBase58("B62qk7R5wo6WTwYSpBHPtfikGvkuasJGEv4ZsSA2sigJdqJqYsWUzA1");
    const token = PublicKey.fromBase58("B62qjZ1W2ybx2AYLYUyjPMoBT6Kn6CPPjAN2WWSRKH46uGgn2SgeNtK");

    const balance = await zkApp.getBalance(account, token);
    console.log("balance", balance.toBigInt());

} catch (err) {
    console.log(err);
}
