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
import { AccountUpdate, Bool, Cache, fetchAccount, Field, Mina, NetworkId, PrivateKey, PublicKey, SmartContract, UInt64, UInt8 } from 'o1js';
import { PoolMina, MinaTokenHolder, FungibleToken, PoolMinaDeployProps, FungibleTokenAdmin, mulDiv } from '../indexmina.js';
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
// B62qrn4bTWsKGddKeLGzriYVQF23fNF4tCnACKawP7ySJfH7zFmd2u6
let zkAppKey = PrivateKey.fromBase58("EKFR61nPLgsRYV2fULL1n1QpGxjjAxXJRrgse43fPvwJsdFS6PRM");
// B62qjDaZ2wDLkFpt7a7eJme6SAJDuc3R3A2j2DRw7VMmJAFahut7e8w
let zkTokenPrivateKey = PrivateKey.fromBase58("EKDpsCUu1roVtrqoprUyseGZVKbPLZMvGagBoN7WRUVHzDWBUWFj");
// B62qmZpuEkuf3MeH2WAkxzXRJMBMmZHb1JxSZqqQR8T3jtt2FUTy9wK
let zkTokenAdminPrivateKey = PrivateKey.fromBase58("EKDym4pZnbRVmWtubWaBgEeQ5GHrhtQc1KyD6sJm5cFaDWcj3vai");

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
let zkTokenAddress = zkTokenPrivateKey.toPublicKey();
let zkToken = new FungibleToken(zkTokenAddress);
let zkTokenAdminAddress = zkTokenAdminPrivateKey.toPublicKey();
let zkTokenAdmin = new FungibleTokenAdmin(zkTokenAdminAddress);

console.log("tokenStandard", zkTokenAddress.toBase58());
console.log("tokenStandard", zkTokenPrivateKey.toBase58());
console.log("pool", zkAppKey.toBase58());
console.log("pool", zkAppAddress.toBase58());
console.log("zkTokenAdmin", zkTokenAdminAddress.toBase58());
console.log("zkTokenAdmin", zkTokenAdminPrivateKey.toBase58());

// compile the contract to create prover keys
console.log('compile the contract...');

const cache: Cache = Cache.FileSystem('./cache');
const key = await PoolMina.compile({ cache });
await FungibleToken.compile({ cache });
await FungibleTokenAdmin.compile({ cache });
await MinaTokenHolder.compile({ cache });

async function ask() {
    try {
        const result = await
            prompt(`Why do you want to do ?
            1 deploy token
            2 deploy pool      
            3 deploy token holder 
            4 add liquidity 
            5 swap mina for token
            6 swap token for mina
            7 updgrade
            8 deploy all
            9 mint token
            10 show event
            `);
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
            case "7":
                await updgrade();
                break;
            case "8":
                await deployAll();
                break;
            case "9":
                await mintToken();
                break;
            case "10":
                await getEvent();
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
                AccountUpdate.fundNewAccount(feepayerAddress, 4);
                await zkTokenAdmin.deploy({
                    adminPublicKey: feepayerAddress,
                });
                await zkToken.deploy({
                    symbol: "LTA",
                    src: "https://github.com/MinaFoundation/mina-fungible-token/blob/main/FungibleToken.ts",
                });
                await zkToken.initialize(
                    zkTokenAdminAddress,
                    UInt8.from(9),
                    Bool(false),
                );
            }
        );
        await tx.prove();
        let sentTx = await tx.sign([feepayerKey, zkTokenPrivateKey]).send();
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
        let tx = await Mina.transaction(
            { sender: feepayerAddress, fee },
            async () => {
                AccountUpdate.fundNewAccount(feepayerAddress, 1);
                await zkApp.deploy({ token: zkTokenAddress, symbol: "LUM", src: "https://luminadex.com/" });
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
        let dexTokenHolder0 = new MinaTokenHolder(zkAppAddress, zkToken.deriveTokenId());
        let tx = await Mina.transaction(
            { sender: feepayerAddress, fee },
            async () => {
                AccountUpdate.fundNewAccount(feepayerAddress, 1);
                await dexTokenHolder0.deploy();
                await zkToken.approveAccountUpdate(dexTokenHolder0.self);
            }
        );
        await tx.prove();
        let sentTx = await tx.sign([feepayerKey, zkAppKey, zkTokenPrivateKey]).send();
        if (sentTx.status === 'pending') {
            console.log("hash", sentTx.hash);
        }


    } catch (err) {
        console.log(err);
    }
}

async function deployAll() {
    try {
        console.log("deploy all");
        let dexTokenHolder0 = new MinaTokenHolder(zkAppAddress, zkToken.deriveTokenId());
        let tx = await Mina.transaction(
            { sender: feepayerAddress, fee },
            async () => {
                AccountUpdate.fundNewAccount(feepayerAddress, 4);
                await zkTokenAdmin.deploy({
                    adminPublicKey: feepayerAddress,
                });
                await zkToken.deploy({
                    symbol: "TOKA",
                    src: "https://github.com/MinaFoundation/mina-fungible-token/blob/main/FungibleToken.ts",
                });
                await zkToken.initialize(
                    zkTokenAdminAddress,
                    UInt8.from(9),
                    Bool(false),
                );

                await zkApp.deploy({ token: zkTokenAddress, symbol: "LUM", src: "https://luminadex.com/" });
                // await dexTokenHolder0.deploy();
                // await zkToken.approveAccountUpdate(dexTokenHolder0.self);
            }
        );
        await tx.prove();
        let sentTx = await tx.sign([feepayerKey, zkAppKey, zkTokenPrivateKey, zkTokenAdminPrivateKey]).send();
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
        let amtMina = UInt64.from(20 * 10 ** 9);
        const token = await zkApp.token.fetch();
        let tx = await Mina.transaction({ sender: feepayerAddress, fee }, async () => {
            AccountUpdate.fundNewAccount(feepayerAddress, 2);
            await zkApp.supplyFirstLiquidities(amtMina, amt);
        });
        console.log("tx liquidity", tx.toPretty());
        await tx.prove();
        let sentTx = await tx.sign([feepayerKey, zkTokenPrivateKey]).send();
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

        await fetchAccount({ publicKey: zkAppAddress });
        await fetchAccount({ publicKey: zkAppAddress, tokenId: zkToken.deriveTokenId() });
        await fetchAccount({ publicKey: feepayerAddress });
        await fetchAccount({ publicKey: feepayerAddress, tokenId: zkToken.deriveTokenId() });

        let amountIn = UInt64.from(1.3 * 10 ** 9);
        let dexTokenHolder = new MinaTokenHolder(zkAppAddress, zkToken.deriveTokenId());

        const reserveIn = Mina.getBalance(zkAppAddress);
        const reserveOut = Mina.getBalance(zkAppAddress, zkToken.deriveTokenId());

        const balanceMin = reserveOut.sub(reserveOut.div(100));
        const balanceMax = reserveIn.add(reserveIn.div(100));

        const expectedOut = mulDiv(balanceMin, amountIn, balanceMax.add(amountIn));

        let tx = await Mina.transaction({ sender: feepayerAddress, fee }, async () => {
            await dexTokenHolder.swapFromMina(amountIn, expectedOut, balanceMax, balanceMin);
            await zkToken.approveAccountUpdate(dexTokenHolder.self);
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
        let amountIn = UInt64.from(20 * 10 ** 9);

        await fetchAccount({ publicKey: zkAppAddress });
        await fetchAccount({ publicKey: zkAppAddress, tokenId: zkToken.deriveTokenId() });
        await fetchAccount({ publicKey: feepayerAddress });
        await fetchAccount({ publicKey: feepayerAddress, tokenId: zkToken.deriveTokenId() });

        const reserveOut = Mina.getBalance(zkAppAddress);
        const reserveIn = Mina.getBalance(zkAppAddress, zkToken.deriveTokenId());

        const balanceMin = reserveOut.sub(reserveOut.div(100));
        const balanceMax = reserveIn.add(reserveIn.div(100));

        const expectedOut = mulDiv(balanceMin, amountIn, balanceMax.add(amountIn));

        let tx = await Mina.transaction({ sender: feepayerAddress, fee }, async () => {
            await zkApp.swapFromToken(amountIn, expectedOut, balanceMax, balanceMin);
        });
        await tx.prove();
        console.log("swap token proof", tx.toPretty());
        let sentTx = await tx.sign([feepayerKey]).send();
        if (sentTx.status === 'pending') {
            console.log("hash", sentTx.hash);
        }

    } catch (err) {
        console.log(err);
    }
}

async function updgrade() {
    try {
        console.log("updgrade");
        let tx = await Mina.transaction({ sender: feepayerAddress, fee }, async () => {
            //await zkApp.updgrade(key.verificationKey);
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

async function mintToken() {
    try {
        console.log("mintToken");
        let tx = await Mina.transaction({ sender: feepayerAddress, fee }, async () => {
            AccountUpdate.fundNewAccount(feepayerAddress, 1);
            await zkToken.mint(feepayerAddress, UInt64.from(100_000 * 10 ** 9));
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


async function getEvent() {
    try {
        console.log("show event");
        await displayEvents(zkApp);
        let dexTokenHolder = new MinaTokenHolder(zkAppAddress, zkToken.deriveTokenId());
        await displayEvents(dexTokenHolder);
    } catch (err) {
        console.log(err);
    }
}

async function displayEvents(contract: SmartContract) {
    let events = await contract.fetchEvents();
    console.log(
        `events on ${contract.address.toBase58()} ${contract.tokenId}`,
        events.map((e) => {
            return { type: e.type, data: JSON.stringify(e.event) };
        })
    );
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
