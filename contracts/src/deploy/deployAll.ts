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
import { AccountUpdate, Bool, Cache, fetchAccount, Field, MerkleMap, Mina, Poseidon, PrivateKey, Provable, PublicKey, Signature, SmartContract, UInt32, UInt64, UInt8, VerificationKey } from 'o1js';
import { PoolTokenHolder, FungibleToken, FungibleTokenAdmin, mulDiv, Faucet, PoolFactory, Pool, getAmountLiquidityOutUint } from '../index.js';
import readline from "readline/promises";
import { Multisig, MultisigInfo, SignatureInfo, SignatureRight, UpdateFactoryInfo, UpdateSignerData } from '../pool/Multisig.js';
import { FactoryIntermediary } from '../pool/FactoryIntermediate.js';

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
let approvedSigner = PrivateKey.fromBase58(process.env.APPROVED_SIGNER!);

const networkUrl = process.env.GRAPHQL!;

// set up Mina instance and contract we interact with
const Network = Mina.Network({
    // We need to default to the testnet networkId if none is specified for this deploy alias in config.json
    // This is to ensure the backward compatibility.
    networkId: "testnet",
    mina: networkUrl,
    archive: process.env.ARCHIVE!,
});
console.log("network", networkUrl);
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
let signerAddress = approvedSigner.toPublicKey();

console.log("token A", zkTokenAAddress.toBase58());
console.log("token B", zkTokenBAddress.toBase58());
console.log("pool token A/Mina", zkPoolTokenAMinaAddress.toBase58());
console.log("pool token A/token B", zkPoolTokenATokenBAddress.toBase58());
console.log("factory", zkFactoryKey.toBase58());
console.log("zkTokenAdmin", zkTokenAdminAddress.toBase58());
console.log("zkFaucet", zkFaucetAddress.toBase58());
console.log("pool ETH/Mina", zkEthAddress.toBase58());
console.log("approved signer", signerAddress.toBase58());

const allRight = new SignatureRight(Bool(true), Bool(true), Bool(true), Bool(true), Bool(true), Bool(true));
const deployRight = SignatureRight.canDeployPool();

const ownerKey = PrivateKey.fromBase58(process.env.OWNER!);
const signer1Key = PrivateKey.fromBase58(process.env.SIGNER1!);
const signer2Key = PrivateKey.fromBase58(process.env.SIGNER2!);
const signer3Key = PrivateKey.fromBase58(process.env.SIGNER3!);

const ownerPublic = ownerKey.toPublicKey();
const signer1Public = signer1Key.toPublicKey();
const signer2Public = signer2Key.toPublicKey();
const signer3Public = signer3Key.toPublicKey();
const externalSigner1 = PublicKey.fromBase58("B62qkjzL662Z5QD16cB9j6Q5TH74y42ALsMhAiyrwWvWwWV1ypfcV65");
const externalSigner2 = PublicKey.fromBase58("B62qpLxXFg4rmhce762uiJjNRnp5Bzc9PnCEAcraeaMkVWkPi7kgsWV");
const externalSigner3 = PublicKey.fromBase58("B62qipa4xp6pQKqAm5qoviGoHyKaurHvLZiWf3djDNgrzdERm6AowSQ");
const approvedSignerPublic = approvedSigner.toPublicKey();

const merkle = new MerkleMap();
merkle.set(Poseidon.hash(ownerPublic.toFields()), allRight.hash());
merkle.set(Poseidon.hash(signer1Public.toFields()), allRight.hash());
merkle.set(Poseidon.hash(signer2Public.toFields()), allRight.hash());
merkle.set(Poseidon.hash(signer3Public.toFields()), allRight.hash());
merkle.set(Poseidon.hash(approvedSignerPublic.toFields()), deployRight.hash());
merkle.set(Poseidon.hash(externalSigner1.toFields()), allRight.hash());
merkle.set(Poseidon.hash(externalSigner2.toFields()), allRight.hash());
merkle.set(Poseidon.hash(externalSigner3.toFields()), allRight.hash());


// compile the contract to create prover keys
console.log('compile the contract...');

const cache: Cache = Cache.FileSystem('./cache');
const keyPoolLatest = await Pool.compile({ cache });
await FungibleToken.compile({ cache });
await FungibleTokenAdmin.compile({ cache });
const keyPoolHolderLatest = await PoolTokenHolder.compile({ cache });
const factoryKey = await PoolFactory.compile({ cache });
await Faucet.compile({ cache });
const intermediary = await FactoryIntermediary.compile();

const hashContract = Field(27167892114307946311220801481226808399786469908061512252307744174796385756329n);
const keyContract = "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";

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
            15 update signer
            16 create token account
            17 supply second liquidity
            18 update factory
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
            case "15":
                await updateSigner();
                break;
            case "16":
                await createTokenAccount();
                break;
            case "17":
                await addSecondLiquidity();
                break;
            case "18":
                await updateFactory();
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
                fundNewAccount(feepayerAddress, 3);
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
                fundNewAccount(feepayerAddress, 2);
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
        const witness = merkle.getWitness(Poseidon.hash(approvedSignerPublic.toFields()));
        let tx = await Mina.transaction(
            { sender: feepayerAddress, fee },
            async () => {
                fundNewAccount(feepayerAddress, 4);
                await zkFactory.createPool(zkPoolTokenAMinaAddress, zkTokenAAddress, approvedSignerPublic, signature, witness, deployRight);
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

        const { genesisTimestamp, slotTime } = Mina.activeInstance.getNetworkConstants();


        const protocolKey = PrivateKey.fromBase58(process.env.PROTOCOL!);
        const delegatorKey = PrivateKey.fromBase58(process.env.DELEGATOR!);

        const root = merkle.getRoot();

        const limit = new Date(2030, 1, 1);
        const date = limit.getTime();

        //const time = today.getTime();
        const timeSlot = getSlotFromTimestamp(date);
        const info = new UpdateSignerData({ oldRoot: Field.empty(), newRoot: root, deadlineSlot: UInt32.from(timeSlot) });

        const signBob = Signature.create(signer1Key, info.toFields());
        const signAlice = Signature.create(signer2Key, info.toFields());

        const multi = new MultisigInfo({ approvedUpgrader: root, messageHash: info.hash(), deadlineSlot: UInt32.from(timeSlot) })
        const infoBob = new SignatureInfo({ user: signer1Public, witness: merkle.getWitness(Poseidon.hash(signer1Public.toFields())), signature: signBob, right: allRight })
        const infoAlice = new SignatureInfo({ user: signer2Public, witness: merkle.getWitness(Poseidon.hash(signer2Public.toFields())), signature: signAlice, right: allRight })
        const array = [infoBob, infoAlice];

        let tx = await Mina.transaction(
            { sender: feepayerAddress, fee },
            async () => {
                fundNewAccount(feepayerAddress, 1);
                await zkFactory.deploy({
                    symbol: "FAC",
                    src: "https://luminadex.com/",
                    delegator: delegatorKey.toPublicKey(),
                    protocol: protocolKey.toPublicKey(),
                    approvedSigner: root,
                    signatures: array,
                    multisigInfo: multi
                });
            }
        );

        console.log("tx", tx.toPretty());
        await tx.prove();
        let sentTx = await tx.sign([feepayerKey, zkFactoryKey]).send();
        if (sentTx.status === 'pending') {
            console.log("hash", sentTx.hash);
        }


    } catch (err) {
        console.log(err);
    }
}


function getSlotFromTimestamp(date: number) {
    const { genesisTimestamp, slotTime } = Mina.activeInstance.getNetworkConstants();
    let slotCalculated = UInt64.from(date);
    slotCalculated = (slotCalculated.sub(genesisTimestamp)).div(slotTime);
    Provable.log("slotCalculated64", slotCalculated);
    return slotCalculated.toUInt32();
}

async function deployPoolEth() {
    try {
        const wethAddress = PublicKey.fromBase58("B62qisgt5S7LwrBKEc8wvWNjW7SGTQjMZJTDL2N6FmZSVGrWiNkV21H");
        console.log("deploy pool eth");
        const signature = Signature.create(approvedSigner, zkEthAddress.toFields());
        const witness = merkle.getWitness(Poseidon.hash(signerAddress.toFields()));
        let tx = await Mina.transaction(
            { sender: feepayerAddress, fee },
            async () => {
                fundNewAccount(feepayerAddress, 4);
                await zkFactory.createPool(zkEthAddress, wethAddress, approvedSigner.toPublicKey(), signature, witness, allRight);
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
        const witness = merkle.getWitness(Poseidon.hash(signerAddress.toFields()));
        let tx = await Mina.transaction(
            { sender: feepayerAddress, fee },
            async () => {
                fundNewAccount(feepayerAddress, 5);
                await zkFactory.createPoolToken(zkPoolTokenATokenBAddress, zkTokenAAddress, zkTokenBAddress, approvedSigner.toPublicKey(), signature, witness, allRight);
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
                fundNewAccount(feepayerAddress, 1);
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
        await fetchAccount({ publicKey: zkPoolTokenAMinaAddress });
        await fetchAccount({ publicKey: zkPoolTokenAMinaAddress, tokenId: zkTokenA.deriveTokenId() });
        await fetchAccount({ publicKey: feepayerAddress });
        await fetchAccount({ publicKey: feepayerAddress, tokenId: zkTokenA.deriveTokenId() });
        await fetchAccount({ publicKey: feepayerAddress, tokenId: zkPoolTokenAMina.deriveTokenId() });

        const token = await zkPoolTokenAMina.token1.fetch();
        let tx = await Mina.transaction({ sender: feepayerAddress, fee }, async () => {
            fundNewAccount(feepayerAddress, 1);
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

async function addSecondLiquidity() {
    try {
        console.log("add liquidity");
        let amtMina = UInt64.from(20 * 10 ** 9);
        const reserve = await getReserves(zkPoolTokenAMinaAddress);
        const out = getAmountLiquidityOutUint(amtMina, reserve.amountMina, reserve.amountToken, reserve.liquidity, UInt64.one);
        const poolTokenAMina = new Pool(zkPoolTokenAMinaAddress);
        fetchAccount({ publicKey: feepayerAddress, tokenId: poolTokenAMina.deriveTokenId() });
        fetchAccount({ publicKey: feepayerAddress, tokenId: poolTokenAMina.deriveTokenId() });
        fetchAccount({ publicKey: feepayerAddress, tokenId: zkTokenA.deriveTokenId() });
        fetchAccount({ publicKey: feepayerAddress });
        let tx = await Mina.transaction({ sender: feepayerAddress, fee }, async () => {
            //fundNewAccount(feepayerAddress, 1);
            await zkPoolTokenAMina.supplyLiquidity(out.amountAIn, out.amountBIn, out.balanceAMax, out.balanceBMax, out.supplyMin);
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

async function getReserves(poolAddress: PublicKey) {
    const acc = await fetchAccount({ publicKey: poolAddress });
    const zkPool = new Pool(poolAddress);
    const token = await zkPool.token1.fetch();
    const zkToken = new FungibleToken(token!);
    const accToken = await fetchAccount({ publicKey: poolAddress, tokenId: zkToken.deriveTokenId() });
    const accLiquidity = await fetchAccount({ publicKey: poolAddress, tokenId: zkPool.deriveTokenId() });
    const amountToken = await accToken.account!.balance;
    const amountMina = await acc.account!.balance;
    const liquidity = await accLiquidity.account!.balance;
    return { amountToken, amountMina, liquidity };
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
        const minOut = expectedOut.sub(expectedOut.div(100));

        let tx = await Mina.transaction({ sender: feepayerAddress, fee }, async () => {
            //AccountUpdate.fundNewAccount(feepayerAddress, 1);
            await dexTokenHolder.swapFromMinaToToken(feepayerAddress, UInt64.from(5), amountIn, minOut, balanceMax, balanceMin);
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

async function createTokenAccount() {
    try {
        console.log("create token account");
        await fetchAccount({ publicKey: zkFactoryAddress });
        const protocol = await zkFactory.getProtocol();
        const feeCollector = feepayerAddress;

        await fetchAccount({ publicKey: feeCollector });
        await fetchAccount({ publicKey: protocol });
        const accFee = await fetchAccount({ publicKey: feeCollector, tokenId: zkTokenA.deriveTokenId() });
        const accProtocol = await fetchAccount({ publicKey: protocol, tokenId: zkTokenA.deriveTokenId() });

        let fees = 0;
        if (!accFee?.account) {
            fees += 1;
        }
        if (!accProtocol?.account) {
            fees += 1;
        }
        let tx = await Mina.transaction({ sender: feepayerAddress, fee }, async () => {
            fundNewAccount(feepayerAddress, fees);
            const updateProtocol = AccountUpdate.create(protocol, zkTokenA.deriveTokenId());
            await zkTokenA.approveAccountUpdate(updateProtocol);
            const updateFee = AccountUpdate.create(feeCollector, zkTokenA.deriveTokenId());
            await zkTokenA.approveAccountUpdate(updateFee);

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
        const minOut = expectedOut.sub(expectedOut.div(100));

        let tx = await Mina.transaction({ sender: feepayerAddress, fee }, async () => {
            await zkPoolTokenAMina.swapFromTokenToMina(feepayerAddress, UInt64.from(5), amountIn, minOut, balanceMax, balanceMin);
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
        await fetchAccount({ publicKey: zkFactoryAddress })
        //const ownerKey = PrivateKey.fromBase58(process.env.OWNER!);
        let tx = await Mina.transaction({ sender: feepayerAddress, fee }, async () => {
            const update = AccountUpdate.createSigned(zkFactoryAddress);
            update.account.verificationKey.set(factoryKey.verificationKey);
        });
        console.log("upgrade  proof", tx.toPretty());
        await tx.prove();
        let sentTx = await tx.sign([feepayerKey, zkFactoryKey]).send();
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
            fundNewAccount(feepayerAddress, 1);
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
            fundNewAccount(feepayerAddress, 1);
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


async function updateSigner() {
    try {
        console.log("update signer");

        const oldFactory = new FactoryIntermediary(zkFactoryAddress)
        let tx = await Mina.transaction(
            { sender: feepayerAddress, fee },
            async () => {
                // signer base on Field number on not signaruteright bool
                await oldFactory.updateApprovedSigner(Field(26964741462010086559092012883954465197512418645285812446994120990540838818419n));
            }
        );

        console.log("tx", tx.toPretty());
        await tx.prove();
        let sentTx = await tx.sign([feepayerKey, zkFactoryKey]).send();
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

function fundNewAccount(feePayer: PublicKey, numberOfAccounts = 1) {
    try {
        const isZeko = networkUrl.includes("zeko");
        const accountUpdate = AccountUpdate.createSigned(feePayer)
        accountUpdate.label = "AccountUpdate.fundNewAccount()"
        const fee = (isZeko
            ? UInt64.from(10 ** 8)
            : Mina.activeInstance.getNetworkConstants().accountCreationFee).mul(numberOfAccounts)
        accountUpdate.balance.subInPlace(fee)
        return accountUpdate
    } catch (error) {
        console.error("fund new account", error)
        return AccountUpdate.fundNewAccount(feePayer, numberOfAccounts)
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

async function updateFactory() {
    try {
        console.log("update signer");
        const root = merkle.getRoot();

        const limit = new Date(2030, 1, 1);
        const date = limit.getTime();

        //const time = today.getTime();
        const timeSlot = getSlotFromTimestamp(date);
        const info = new UpdateFactoryInfo({ newVkHash: intermediary.verificationKey.hash, deadlineSlot: UInt32.from(timeSlot) });

        const signBob = Signature.create(signer1Key, info.toFields());
        const signAlice = Signature.create(signer2Key, info.toFields());

        const allRight = new SignatureRight(Bool(true), Bool(true), Bool(true), Bool(true), Bool(true), Bool(true))

        const multi = new MultisigInfo({ approvedUpgrader: root, messageHash: info.hash(), deadlineSlot: UInt32.from(timeSlot) })
        const infoBob = new SignatureInfo({ user: signer1Public, witness: merkle.getWitness(Poseidon.hash(signer1Public.toFields())), signature: signBob, right: allRight })
        const infoAlice = new SignatureInfo({ user: signer2Public, witness: merkle.getWitness(Poseidon.hash(signer2Public.toFields())), signature: signAlice, right: allRight })
        const array = [infoBob, infoAlice];
        const proof = new Multisig({ info: multi, signatures: array });

        const oldFactory = new PoolFactory(zkFactoryAddress)
        // let tx = await Mina.transaction(
        //     { sender: feepayerAddress, fee },
        //     async () => {
        //         await oldFactory.updateVerificationKey(proof, intermediary.verificationKey);
        //     }
        // );

        const intFactory = new FactoryIntermediary(zkFactoryAddress);

        let tx = await Mina.transaction(
            { sender: feepayerAddress, fee },
            async () => {
                await intFactory.updateVerificationKey(new VerificationKey({ data: keyContract, hash: hashContract }));
            }
        );


        console.log("tx", tx.toPretty());
        await tx.prove();
        let sentTx = await tx.sign([feepayerKey, zkFactoryKey]).send();
        if (sentTx.status === 'pending') {
            console.log("hash", sentTx.hash);
        }

    } catch (err) {
        console.log(err);
    }
}

