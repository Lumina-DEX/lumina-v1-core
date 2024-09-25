"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const worker_threads_1 = require("worker_threads");
const o1js_1 = require("o1js");
console.log('Load Web Worker.');
// ---------------------------------------------------------------------------------------
const state = {
    TokenAdmin: null,
    TokenStandard: null,
    PoolMina: null,
    PoolFactory: null,
    PoolMinaHolder: null,
    Faucet: null,
    zkapp: null,
    zkFactory: null,
    zkHolder: null,
    zkToken: null,
    zkFaucet: null,
    transaction: null,
    key: null,
    isZeko: false,
};
const testPrivateKey = 'EKEEHJZhoyjfJEvLoLCrRZosz29hnfn8Nx6Wfx74hgQV4xbrkCTf';
const testPublicKey = 'B62qrLNBqyoECio41DRkRio2DjPsVQUkcyDitM3F9t1ajK3vp2UApja';
const frontend = o1js_1.PublicKey.fromBase58("B62qoSZbMLJSP7dHLqe8spFPFSsUoENnMSHJN8i5bS1X4tdGpAZuwAC");
const protocol = o1js_1.PublicKey.fromBase58("B62qk7R5wo6WTwYSpBHPtfikGvkuasJGEv4ZsSA2sigJdqJqYsWUzA1");
// ---------------------------------------------------------------------------------------
const functions = {
    setActiveInstanceToDevnet: async (args) => {
        let currentLocation = self.location.origin;
        const devnet = o1js_1.Mina.Network({
            networkId: "testnet",
            mina: "https://api.minascan.io/node/devnet/v1/graphql",
            archive: 'https://api.minascan.io/archive/devnet/v1/graphql'
        });
        state.isZeko = false;
        o1js_1.Mina.setActiveInstance(devnet);
    },
    setActiveInstanceToZeko: async (args) => {
        const zeko = o1js_1.Mina.Network({
            networkId: "testnet",
            mina: "https://devnet.zeko.io/graphql",
            //archive: 'https://api.minascan.io/archive/devnet/v1/graphql'
        });
        state.isZeko = true;
        o1js_1.Mina.setActiveInstance(zeko);
    },
    getActiveInstance: async (args) => {
        return JSON.stringify({ isZeko: state.isZeko });
    },
    loadContract: async (args) => {
        const { PoolFactory, PoolMina, PoolTokenHolder, FungibleToken, FungibleTokenAdmin, Faucet } = await Promise.resolve().then(() => __importStar(require("@contracts/build/src/indexmina")));
        // @ts-ignore
        state.PoolMina = PoolMina;
        state.PoolFactory = PoolFactory;
        state.PoolMinaHolder = PoolTokenHolder;
        state.TokenStandard = FungibleToken;
        state.TokenAdmin = FungibleTokenAdmin;
        state.Faucet = Faucet;
    },
    compileContract: async (args) => {
        console.time("compile");
        const cache = o1js_1.Cache.FileSystem("./cache");
        await state.TokenAdmin?.compile({ cache });
        await state.TokenStandard?.compile({ cache });
        await state.PoolFactory.compile({ cache });
        await state.PoolMinaHolder.compile({ cache });
        await state.PoolMina.compile({ cache });
        await state.Faucet.compile({ cache });
        console.timeEnd("compile");
    },
    fetchAccount: async (args) => {
        const publicKey = o1js_1.PublicKey.fromBase58(args.publicKey58);
        return await (0, o1js_1.fetchAccount)({ publicKey });
    },
    fetchAccountToken: async (args) => {
        const publicKey = o1js_1.PublicKey.fromBase58(args.publicKey58);
        return await (0, o1js_1.fetchAccount)({ publicKey, tokenId: state.zkToken?.deriveTokenId() });
    },
    getBalance: async (args) => {
        const publicKey = o1js_1.PublicKey.fromBase58(args.publicKey58);
        const balance = o1js_1.Mina.getBalance(publicKey);
        return JSON.stringify(balance.toJSON());
    },
    initZkappInstance: async (args) => {
        const publicKey = o1js_1.PublicKey.fromBase58(args.pool);
        await (0, o1js_1.fetchAccount)({ publicKey });
        state.zkapp = new state.PoolMina(publicKey);
        const token = await state.zkapp.token.fetch();
        await (0, o1js_1.fetchAccount)({ publicKey: token });
        state.zkToken = new state.TokenStandard(token);
        const factoryKey = o1js_1.PublicKey.fromBase58(args.factory);
        await (0, o1js_1.fetchAccount)({ publicKey: factoryKey });
        state.zkFactory = new state.PoolFactory(factoryKey);
        await (0, o1js_1.fetchAccount)({ publicKey, tokenId: state.zkToken.deriveTokenId() });
        state.zkHolder = new state.PoolMinaHolder(publicKey, state.zkToken.deriveTokenId());
        const publicKeyFaucet = o1js_1.PublicKey.fromBase58(args.faucet);
        await (0, o1js_1.fetchAccount)({ publicKey: publicKeyFaucet, tokenId: state.zkToken.deriveTokenId() });
        state.zkFaucet = new state.Faucet(publicKeyFaucet, state.zkToken.deriveTokenId());
    },
    deployPoolInstance: async (args) => {
        const poolKey = o1js_1.PrivateKey.random();
        console.log("appkey", poolKey.toBase58());
        console.log("pool address", poolKey.toPublicKey().toBase58());
        const tokenKey = o1js_1.PublicKey.fromBase58(args.tokenX);
        const userKey = o1js_1.PublicKey.fromBase58(args.user);
        const transaction = await o1js_1.Mina.transaction(userKey, async () => {
            o1js_1.AccountUpdate.fundNewAccount(userKey, 4);
            await state.zkFactory.createPool(poolKey.toPublicKey(), tokenKey);
        });
        state.transaction = transaction;
        await state.transaction.prove();
        await state.transaction.sign([poolKey]);
        state.key = poolKey.toBase58();
    },
    getSupply: async (args) => {
        const acc = await (0, o1js_1.fetchAccount)({ publicKey: state.zkapp.address, tokenId: state.zkapp?.deriveTokenId() });
        return JSON.stringify(acc.account.balance.toJSON());
    },
    getBalances: async (args) => {
        const publicKey = o1js_1.PublicKey.fromBase58(args.user);
        const accMina = await (0, o1js_1.fetchAccount)({ publicKey });
        const acc = await (0, o1js_1.fetchAccount)({ publicKey, tokenId: state.zkToken?.deriveTokenId() });
        const accLiquidity = await (0, o1js_1.fetchAccount)({ publicKey, tokenId: state.zkapp?.deriveTokenId() });
        const bal = accMina.account ? accMina.account.balance : 0;
        const balToken = acc.account ? acc.account.balance : 0;
        const balLiquidity = accLiquidity.account ? accLiquidity.account.balance : 0;
        return JSON.stringify({ mina: bal, token: balToken, liquidity: balLiquidity });
    },
    getReserves: async (args) => {
        const poolAddress = o1js_1.PublicKey.fromBase58(args.pool);
        const acc = await (0, o1js_1.fetchAccount)({ publicKey: poolAddress });
        const zkPool = new state.PoolMina(poolAddress);
        const token = await zkPool.token.fetch();
        const zkToken = new state.TokenStandard(token);
        const accToken = await (0, o1js_1.fetchAccount)({ publicKey: poolAddress, tokenId: zkToken.deriveTokenId() });
        const accLiquidity = await (0, o1js_1.fetchAccount)({ publicKey: poolAddress, tokenId: zkPool.deriveTokenId() });
        const amountToken = await accToken.account.balance;
        const amountMina = await acc.account.balance;
        const liquidity = await accLiquidity.account.balance;
        return JSON.stringify({ amountToken, amountMina, liquidity });
    },
    swapFromMinaTransaction: async (args) => {
        const poolAddress = o1js_1.PublicKey.fromBase58(args.pool);
        const zkPool = new state.PoolMina(poolAddress);
        const token = await zkPool.token.fetch();
        const zkToken = new state.TokenStandard(token);
        const zkPoolHolder = new state.PoolMinaHolder(poolAddress, zkToken.deriveTokenId());
        const amtIn = Math.trunc(args.amt);
        const amtOut = Math.trunc(args.minOut);
        const balanceOut = Math.trunc(args.balanceOutMin);
        const balanceIn = Math.trunc(args.balanceInMax);
        console.log("Network", o1js_1.Mina.getNetworkId());
        console.log("Graphql", o1js_1.Mina.activeInstance.getNetworkState);
        const publicKey = o1js_1.PublicKey.fromBase58(args.user);
        await (0, o1js_1.fetchAccount)({ publicKey: poolAddress });
        await (0, o1js_1.fetchAccount)({ publicKey: poolAddress, tokenId: zkToken.deriveTokenId() });
        await (0, o1js_1.fetchAccount)({ publicKey });
        const acc = await (0, o1js_1.fetchAccount)({ publicKey, tokenId: zkToken.deriveTokenId() });
        const accFront = await (0, o1js_1.fetchAccount)({ publicKey: frontend, tokenId: zkToken.deriveTokenId() });
        let newAcc = acc.account ? 0 : 1;
        let newFront = accFront.account ? 0 : 1;
        let total = newAcc + newFront;
        console.log("token", token?.toBase58());
        const transaction = await o1js_1.Mina.transaction(publicKey, async () => {
            o1js_1.AccountUpdate.fundNewAccount(publicKey, total);
            await zkPoolHolder.swapFromMina(frontend, o1js_1.UInt64.from(amtIn), o1js_1.UInt64.from(amtOut), o1js_1.UInt64.from(balanceIn), o1js_1.UInt64.from(balanceOut));
            await zkToken?.approveAccountUpdate(zkPoolHolder.self);
        });
        state.transaction = transaction;
        await state.transaction.prove();
    },
    swapFromTokenTransaction: async (args) => {
        const poolAddress = o1js_1.PublicKey.fromBase58(args.pool);
        const zkPool = new state.PoolMina(poolAddress);
        const token = await zkPool.token.fetch();
        const zkToken = new state.TokenStandard(token);
        const amtIn = Math.trunc(args.amt);
        const amtOut = Math.trunc(args.minOut);
        const balanceOut = Math.trunc(args.balanceOutMin);
        const balanceIn = Math.trunc(args.balanceInMax);
        const publicKey = o1js_1.PublicKey.fromBase58(args.user);
        await (0, o1js_1.fetchAccount)({ publicKey: poolAddress });
        await (0, o1js_1.fetchAccount)({ publicKey: poolAddress, tokenId: zkToken.deriveTokenId() });
        await (0, o1js_1.fetchAccount)({ publicKey });
        await (0, o1js_1.fetchAccount)({ publicKey, tokenId: zkToken?.deriveTokenId() });
        console.log("token", token?.toBase58());
        const transaction = await o1js_1.Mina.transaction(publicKey, async () => {
            await zkPool.swapFromToken(frontend, o1js_1.UInt64.from(amtIn), o1js_1.UInt64.from(amtOut), o1js_1.UInt64.from(balanceIn), o1js_1.UInt64.from(balanceOut));
        });
        state.transaction = transaction;
        await state.transaction.prove();
    },
    addLiquidity: async (args) => {
        const poolAddress = o1js_1.PublicKey.fromBase58(args.pool);
        const zkPool = new state.PoolMina(poolAddress);
        const token = await zkPool.token.fetch();
        const zkToken = new state.TokenStandard(token);
        const amtMinaIn = Math.trunc(args.amtMina);
        const amtTokenIn = Math.trunc(args.amtToken);
        const reserveMina = Math.trunc(args.reserveMinaMax);
        const reserveToken = Math.trunc(args.reserveTokenMax);
        const supply = Math.trunc(args.supplyMin);
        const publicKey = o1js_1.PublicKey.fromBase58(args.user);
        await (0, o1js_1.fetchAccount)({ publicKey: poolAddress });
        await (0, o1js_1.fetchAccount)({ publicKey: poolAddress, tokenId: zkToken.deriveTokenId() });
        await (0, o1js_1.fetchAccount)({ publicKey });
        await (0, o1js_1.fetchAccount)({ publicKey, tokenId: zkToken.deriveTokenId() });
        console.log("add liquidity");
        const acc = await (0, o1js_1.fetchAccount)({ publicKey, tokenId: zkPool.deriveTokenId() });
        const accPro = await (0, o1js_1.fetchAccount)({ publicKey: protocol, tokenId: zkPool.deriveTokenId() });
        let newAcc = acc.account ? 0 : 1;
        let newAccPro = accPro.account ? 0 : 1;
        let total = newAcc + newAccPro;
        console.log("total fund liquidity", total);
        console.log("address", { poolAddress: poolAddress.toBase58(), token: token.toBase58() });
        const transaction = await o1js_1.Mina.transaction(publicKey, async () => {
            o1js_1.AccountUpdate.fundNewAccount(publicKey, total);
            if (supply > 0) {
                await zkPool.supplyLiquidity(o1js_1.UInt64.from(amtMinaIn), o1js_1.UInt64.from(amtTokenIn), o1js_1.UInt64.from(reserveMina), o1js_1.UInt64.from(reserveToken), o1js_1.UInt64.from(supply));
            }
            else {
                await zkPool.supplyFirstLiquidities(o1js_1.UInt64.from(amtMinaIn), o1js_1.UInt64.from(amtTokenIn));
            }
        });
        state.transaction = transaction;
        await state.transaction.prove();
    },
    withdrawLiquidity: async (args) => {
        const poolAddress = o1js_1.PublicKey.fromBase58(args.pool);
        const zkPool = new state.PoolMina(poolAddress);
        const token = await zkPool.token.fetch();
        const zkToken = new state.TokenStandard(token);
        const zkPoolHolder = new state.PoolMinaHolder(poolAddress, zkToken.deriveTokenId());
        const liquidityAmountIn = Math.trunc(args.liquidityAmount);
        const amountMinaOut = Math.trunc(args.amountMinaMin);
        const amountTokenOut = Math.trunc(args.amountTokenMin);
        const reserveMina = Math.trunc(args.reserveMinaMin);
        const reserveToken = Math.trunc(args.reserveTokenMin);
        const supply = Math.trunc(args.supplyMax);
        const publicKey = o1js_1.PublicKey.fromBase58(args.user);
        await (0, o1js_1.fetchAccount)({ publicKey: poolAddress });
        await (0, o1js_1.fetchAccount)({ publicKey: poolAddress, tokenId: zkToken.deriveTokenId() });
        await (0, o1js_1.fetchAccount)({ publicKey });
        await (0, o1js_1.fetchAccount)({ publicKey, tokenId: zkToken.deriveTokenId() });
        await (0, o1js_1.fetchAccount)({ publicKey, tokenId: zkPool.deriveTokenId() });
        console.log("withdraw liquidity");
        const transaction = await o1js_1.Mina.transaction(publicKey, async () => {
            await zkPoolHolder.withdrawLiquidity(o1js_1.UInt64.from(liquidityAmountIn), o1js_1.UInt64.from(amountMinaOut), o1js_1.UInt64.from(amountTokenOut), o1js_1.UInt64.from(reserveMina), o1js_1.UInt64.from(reserveToken), o1js_1.UInt64.from(supply));
            await zkToken.approveAccountUpdate(zkPoolHolder.self);
        });
        state.transaction = transaction;
        await state.transaction.prove();
    },
    claim: async (args) => {
        console.log("Network", o1js_1.Mina.getNetworkId());
        console.log("Graphql", o1js_1.Mina.activeInstance.getNetworkState);
        const publicKey = o1js_1.PublicKey.fromBase58(args.user);
        await (0, o1js_1.fetchAccount)({ publicKey: state.zkFaucet.address });
        await (0, o1js_1.fetchAccount)({ publicKey: state.zkFaucet.address, tokenId: state.zkToken.deriveTokenId() });
        await (0, o1js_1.fetchAccount)({ publicKey });
        const acc = await (0, o1js_1.fetchAccount)({ publicKey, tokenId: state.zkToken?.deriveTokenId() });
        const accFau = await (0, o1js_1.fetchAccount)({ publicKey, tokenId: state.zkFaucet?.deriveTokenId() });
        let newAcc = acc.account?.balance ? 0 : 1;
        let newFau = accFau.account?.balance ? 0 : 1;
        const total = newAcc + newFau;
        const token = await state.zkFaucet?.token.fetch();
        console.log("token", token?.toBase58());
        const transaction = await o1js_1.Mina.transaction(publicKey, async () => {
            o1js_1.AccountUpdate.fundNewAccount(publicKey, total);
            await state.zkFaucet.claim();
            await state.zkToken?.approveAccountUpdate(state.zkFaucet.self);
        });
        state.transaction = transaction;
        await state.transaction.prove();
        //await state.transaction!.sign([PrivateKey.fromBase58(testPrivateKey)]).send();
    },
    getTransactionJSON: async (args) => {
        return state.transaction.toJSON();
    },
    getKey: async (args) => {
        return state.key;
    },
};
worker_threads_1.parentPort?.addEventListener("message", async (event) => {
    functions[event.data.fn](event.data.args).then(x => {
        const message = {
            id: event.data.id,
            data: x,
            error: null
        };
        postMessage(message);
    }).catch(x => {
        const messageError = {
            id: event.data.id,
            data: null,
            error: x
        };
        postMessage(messageError);
    });
});
console.log('Web Worker Successfully Initialized.');
