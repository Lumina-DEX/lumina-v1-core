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
import { AccountUpdate, Bool, Cache, fetchAccount, MerkleTree, Mina, Poseidon, PrivateKey, PublicKey, Signature, SmartContract, UInt64, UInt8 } from 'o1js';
import { PoolTokenHolder, FungibleToken, FungibleTokenAdmin, mulDiv, Faucet, PoolFactory, Pool, SignerMerkleWitness } from '../index.js';
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

let feepayerKey = PrivateKey.fromBase58(process.env.FEE_PAYER!);
let zkPoolTokenAMinaKey = PrivateKey.fromBase58(process.env.POOL_TOKA_MINA!);
let zkPoolTokenATokenBKey = PrivateKey.fromBase58(process.env.POOL_TOKA_TOKB!);
let zkTokenAPrivateKey = PrivateKey.fromBase58(process.env.TOKA!);
let zkTokenBPrivateKey = PrivateKey.fromBase58(process.env.TOKB!);
let zkTokenAdminPrivateKey = PrivateKey.fromBase58(process.env.TOKEN_ADMIN!);
let zkFaucetKey = PrivateKey.fromBase58(process.env.FAUCET!);
let zkFactoryKey = PrivateKey.fromBase58(process.env.FACTORY!);
let zkEthKey = PrivateKey.fromBase58(process.env.POOL_ETH_MINA!);
// use it to deploy pool on testnet
// B62qpko6oWqKU4LwAaT7PSX3b6TYvroj6umbpyEXL5EEeBbiJTUMU5Z
let approvedSigner = PrivateKey.fromBase58("EKE9dyeMmvz6deCC2jD9rBk7d8bG6ZDqVno8wRe8tAbQDussfBYi");

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
let zkPoolTokenAMinaAddress = zkPoolTokenAMinaKey.toPublicKey();
let zkPoolTokenAMina = new Pool(zkPoolTokenAMinaAddress);
let zkPoolTokenATokenBAddress = zkPoolTokenATokenBKey.toPublicKey();
let zkPoolTokenATokenB = new Pool(zkPoolTokenATokenBAddress);
let zkFactoryAddress = zkFactoryKey.toPublicKey();
let zkFactory = new PoolFactory(zkFactoryAddress);
let zkTokenAAddress = zkTokenAPrivateKey.toPublicKey();
let zkTokenA = new FungibleToken(zkTokenAAddress);
let zkTokenBAddress = zkTokenBPrivateKey.toPublicKey();
let zkTokenB = new FungibleToken(zkTokenBAddress);
let zkTokenAdminAddress = zkTokenAdminPrivateKey.toPublicKey();
let zkTokenAdmin = new FungibleTokenAdmin(zkTokenAdminAddress);
let zkFaucetAddress = zkFaucetKey.toPublicKey();
let zkFaucet = new Faucet(zkFaucetAddress, zkTokenA.deriveTokenId());
let zkEthAddress = zkEthKey.toPublicKey();
let zkPoolEthMina = new Pool(zkEthAddress);

console.log("token A", zkTokenAAddress.toBase58());
console.log("token B", zkTokenBAddress.toBase58());
console.log("pool token A/Mina", zkPoolTokenAMinaAddress.toBase58());
console.log("pool token A/token B", zkPoolTokenATokenBAddress.toBase58());
console.log("factory", zkFactoryKey.toBase58());
console.log("zkTokenAdmin", zkTokenAdminAddress.toBase58());
console.log("zkFaucet", zkFaucetAddress.toBase58());
console.log("pool ETH/Mina", zkEthAddress.toBase58());
console.log("approved signer", zkEthAddress.toBase58());

const merkle = new MerkleTree(32);
merkle.setLeaf(0n, Poseidon.hash(feepayerAddress.toFields()));
merkle.setLeaf(1n, Poseidon.hash(approvedSigner.toFields()));
const root = merkle.getRoot();

// compile the contract to create prover keys
console.log('compile the contract...');

const cache: Cache = Cache.FileSystem('./cache');
const key = await Pool.compile({ cache });
await FungibleToken.compile({ cache });
await FungibleTokenAdmin.compile({ cache });
await PoolTokenHolder.compile({ cache });
await PoolFactory.compile({ cache });
await Faucet.compile({ cache });
//const keyV2 = await PoolMinaV2.compile({ cache });

async function ask() {
    try {
        const result = await
            prompt(`Why do you want to do ?
            1 deploy token A
            2 deploy pool token A/Mina     
            3 deploy factory
            4 add liquidity 
            5 swap mina for token
            6 swap token for mina
            7 upgrade
            8 deploy pool eth
            9 mint token
            10 show event
            11 deploy faucet
            12 deploy token B
            13 deploy pool token A/token B (Only on zeko)
            14 mint token B
            `);
        switch (result) {
            case "1":
                await deployTokenA();
                break;
            case "2":
                await deployPool();
                break;
            case "3":
                await deployFactory();
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
                await upgrade();
                break;
            case "8":
                await deployPoolEth();
                break;
            case "9":
                await mintTokenA();
                break;
            case "10":
                await getEvent();
                break;
            case "11":
                await deployFaucet();
                break;
            case "12":
                await deployTokenB();
                break;
            case "13":
                await deployPoolToken();
                break;
            case "14":
                await mintTokenB();
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

async function deployTokenA() {
    try {
        console.log("deploy token A");

        let tx = await Mina.transaction(
            { sender: feepayerAddress, fee },
            async () => {
                AccountUpdate.fundNewAccount(feepayerAddress, 4);
                await zkTokenAdmin.deploy({
                    adminPublicKey: feepayerAddress,
                });
                await zkTokenA.deploy({
                    symbol: "TokenA",
                    src: "https://github.com/MinaFoundation/mina-fungible-token/blob/main/FungibleToken.ts",
                    allowUpdates: true
                });
                await zkTokenA.initialize(
                    zkTokenAdminAddress,
                    UInt8.from(9),
                    Bool(false),
                );
            }
        );
        await tx.prove();
        let sentTx = await tx.sign([feepayerKey, zkTokenAPrivateKey, zkTokenAdminPrivateKey]).send();
        if (sentTx.status === 'pending') {
            console.log("hash", sentTx.hash);
        }


    } catch (err) {
        console.log(err);
    }
}


async function deployTokenB() {
    try {
        console.log("deploy token B");

        let tx = await Mina.transaction(
            { sender: feepayerAddress, fee },
            async () => {
                AccountUpdate.fundNewAccount(feepayerAddress, 4);
                await zkTokenAdmin.deploy({
                    adminPublicKey: feepayerAddress,
                });
                await zkTokenB.deploy({
                    symbol: "TokenB",
                    src: "https://github.com/MinaFoundation/mina-fungible-token/blob/main/FungibleToken.ts",
                    allowUpdates: true
                });
                await zkTokenB.initialize(
                    zkTokenAdminAddress,
                    UInt8.from(9),
                    Bool(false),
                );
            }
        );
        await tx.prove();
        let sentTx = await tx.sign([feepayerKey, zkTokenBPrivateKey, zkTokenAdminPrivateKey]).send();
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
        const signature = Signature.create(approvedSigner, zkPoolTokenAMinaAddress.toFields());
        const witness = merkle.getWitness(1n);
        const circuitWitness = new SignerMerkleWitness(witness);
        let tx = await Mina.transaction(
            { sender: feepayerAddress, fee },
            async () => {
                AccountUpdate.fundNewAccount(feepayerAddress, 4);
                await zkFactory.createPool(zkPoolTokenAMinaAddress, zkTokenAAddress, approvedSigner.toPublicKey(), signature, circuitWitness);
            }
        );
        await tx.prove();
        let sentTx = await tx.sign([feepayerKey, zkPoolTokenAMinaKey]).send();
        if (sentTx.status === 'pending') {
            console.log("hash", sentTx.hash);
        }


    } catch (err) {
        console.log(err);
    }
}


async function deployFactory() {
    try {
        console.log("deploy factory");
        const ownerKey = PrivateKey.fromBase58(process.env.OWNER!);
        const protocolKey = PrivateKey.fromBase58(process.env.PROTOCOL!);
        const delegatorKey = PrivateKey.fromBase58(process.env.DELEGATOR!);
        let tx = await Mina.transaction(
            { sender: feepayerAddress, fee },
            async () => {
                AccountUpdate.fundNewAccount(feepayerAddress, 1);
                await zkFactory.deploy({ symbol: "FAC", src: "https://luminadex.com/", delegator: delegatorKey.toPublicKey(), owner: ownerKey.toPublicKey(), protocol: protocolKey.toPublicKey(), approvedSigner: root });
            }
        );
        await tx.prove();
        let sentTx = await tx.sign([feepayerKey, zkFactoryKey]).send();
        if (sentTx.status === 'pending') {
            console.log("hash", sentTx.hash);
        }


    } catch (err) {
        console.log(err);
    }
}

async function deployPoolEth() {
    try {
        const wethAddress = PublicKey.fromBase58("B62qisgt5S7LwrBKEc8wvWNjW7SGTQjMZJTDL2N6FmZSVGrWiNkV21H");
        console.log("deploy pool eth");
        const signature = Signature.create(approvedSigner, zkEthAddress.toFields());
        const witness = merkle.getWitness(1n);
        const circuitWitness = new SignerMerkleWitness(witness);
        let tx = await Mina.transaction(
            { sender: feepayerAddress, fee },
            async () => {
                AccountUpdate.fundNewAccount(feepayerAddress, 4);
                await zkFactory.createPool(zkEthAddress, wethAddress, approvedSigner.toPublicKey(), signature, circuitWitness);
            }
        );
        await tx.prove();
        let sentTx = await tx.sign([feepayerKey, zkEthKey]).send();
        if (sentTx.status === 'pending') {
            console.log("hash", sentTx.hash);
        }

    } catch (err) {
        console.log(err);
    }
}


async function deployPoolToken() {
    try {
        console.log("deploy pool token A/token B");
        const signature = Signature.create(approvedSigner, zkPoolTokenATokenBAddress.toFields());
        const witness = merkle.getWitness(1n);
        const circuitWitness = new SignerMerkleWitness(witness);
        let tx = await Mina.transaction(
            { sender: feepayerAddress, fee },
            async () => {
                AccountUpdate.fundNewAccount(feepayerAddress, 5);
                await zkFactory.createPoolToken(zkPoolTokenATokenBAddress, zkTokenAAddress, zkTokenBAddress, approvedSigner.toPublicKey(), signature, circuitWitness);
            }
        );
        await tx.prove();
        let sentTx = await tx.sign([feepayerKey, zkPoolTokenATokenBKey]).send();
        if (sentTx.status === 'pending') {
            console.log("hash", sentTx.hash);
        }


    } catch (err) {
        console.log(err);
    }
}

async function deployFaucet() {
    try {
        console.log("deploy faucet");

        let tx = await Mina.transaction(
            { sender: feepayerAddress, fee },
            async () => {
                AccountUpdate.fundNewAccount(feepayerAddress, 1);
                // 100 token by claim
                await zkFaucet.deploy({
                    token: zkTokenAAddress,
                    amount: UInt64.from(100 * 10 ** 9)
                });
                await zkTokenA.approveAccountUpdate(zkFaucet.self);

                // 1'000'000 tokens in the faucet
                await zkTokenA.mint(
                    zkFaucetAddress,
                    UInt64.from(1000000 * 10 ** 9)
                );
            }
        );
        await tx.prove();
        let sentTx = await tx.sign([feepayerKey, zkTokenAPrivateKey, zkFaucetKey]).send();
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
        const token = await zkPoolTokenAMina.token1.fetch();
        let tx = await Mina.transaction({ sender: feepayerAddress, fee }, async () => {
            AccountUpdate.fundNewAccount(feepayerAddress, 2);
            await zkPoolTokenAMina.supplyFirstLiquidities(amtMina, amt);
        });
        console.log("tx liquidity", tx.toPretty());
        await tx.prove();
        let sentTx = await tx.sign([feepayerKey, zkTokenAPrivateKey]).send();
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

        await fetchAccount({ publicKey: zkPoolTokenAMinaAddress });
        await fetchAccount({ publicKey: zkPoolTokenAMinaAddress, tokenId: zkTokenA.deriveTokenId() });
        await fetchAccount({ publicKey: feepayerAddress });
        await fetchAccount({ publicKey: feepayerAddress, tokenId: zkTokenA.deriveTokenId() });

        let amountIn = UInt64.from(1.3 * 10 ** 9);
        let dexTokenHolder = new PoolTokenHolder(zkPoolTokenAMinaAddress, zkTokenA.deriveTokenId());

        const reserveIn = Mina.getBalance(zkPoolTokenAMinaAddress);
        const reserveOut = Mina.getBalance(zkPoolTokenAMinaAddress, zkTokenA.deriveTokenId());

        const balanceMin = reserveOut.sub(reserveOut.div(100));
        const balanceMax = reserveIn.add(reserveIn.div(100));

        const expectedOut = mulDiv(balanceMin, amountIn, balanceMax.add(amountIn));

        let tx = await Mina.transaction({ sender: feepayerAddress, fee }, async () => {
            await dexTokenHolder.swapFromMinaToToken(feepayerAddress, UInt64.from(5), amountIn, expectedOut, balanceMax, balanceMin);
            await zkTokenA.approveAccountUpdate(dexTokenHolder.self);
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

        await fetchAccount({ publicKey: zkPoolTokenAMinaAddress });
        await fetchAccount({ publicKey: zkPoolTokenAMinaAddress, tokenId: zkTokenA.deriveTokenId() });
        await fetchAccount({ publicKey: feepayerAddress });
        await fetchAccount({ publicKey: feepayerAddress, tokenId: zkTokenA.deriveTokenId() });

        const reserveOut = Mina.getBalance(zkPoolTokenAMinaAddress);
        const reserveIn = Mina.getBalance(zkPoolTokenAMinaAddress, zkTokenA.deriveTokenId());

        const balanceMin = reserveOut.sub(reserveOut.div(100));
        const balanceMax = reserveIn.add(reserveIn.div(100));

        const expectedOut = mulDiv(balanceMin, amountIn, balanceMax.add(amountIn));

        let tx = await Mina.transaction({ sender: feepayerAddress, fee }, async () => {
            await zkPoolTokenAMina.swapFromTokenToMina(feepayerAddress, UInt64.from(5), amountIn, expectedOut, balanceMax, balanceMin);
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

async function upgrade() {
    try {
        console.log("upgrade");
        let tx = await Mina.transaction({ sender: feepayerAddress, fee }, async () => {
            //  await zkApp.updateVerificationKey(keyV2.verificationKey);
        });
        await tx.prove();
        let sentTx = await tx.sign([feepayerKey, zkPoolTokenAMinaKey]).send();
        if (sentTx.status === 'pending') {
            console.log("hash", sentTx.hash);
        }

    } catch (err) {
        console.log(err);
    }
}

async function mintTokenA() {
    try {
        console.log("mintToken A");
        let tx = await Mina.transaction({ sender: feepayerAddress, fee }, async () => {
            AccountUpdate.fundNewAccount(feepayerAddress, 1);
            await zkTokenA.mint(feepayerAddress, UInt64.from(100_000 * 10 ** 9));
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

async function mintTokenB() {
    try {
        console.log("mintToken B");
        let tx = await Mina.transaction({ sender: feepayerAddress, fee }, async () => {
            AccountUpdate.fundNewAccount(feepayerAddress, 1);
            await zkTokenB.mint(feepayerAddress, UInt64.from(100_000 * 10 ** 9));
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
        await displayEvents(zkPoolTokenAMina);
        let dexTokenHolder = new PoolTokenHolder(zkPoolTokenAMinaAddress, zkTokenA.deriveTokenId());
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
