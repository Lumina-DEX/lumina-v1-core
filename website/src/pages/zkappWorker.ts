import { Account, AccountUpdate, Bool, Mina, PrivateKey, PublicKey, UInt32, UInt64, fetchAccount } from "o1js";

console.log('Load Web Worker.');

import type { PoolMina, MinaTokenHolder, FungibleToken, FungibleTokenAdmin } from "../../../contracts/src/indexmina";
import Liquidity from "@/components/Liquidity";
import { fetchFiles, readCache } from "./cache";

type Transaction = Awaited<ReturnType<typeof Mina.transaction>>;

// ---------------------------------------------------------------------------------------

const state = {
  TokenAdmin: null as null | typeof FungibleTokenAdmin,
  TokenStandard: null as null | typeof FungibleToken,
  PoolMina: null as null | typeof PoolMina,
  PoolMinaHolder: null as null | typeof MinaTokenHolder,
  zkapp: null as null | PoolMina,
  zkHolder: null as null | MinaTokenHolder,
  zkToken: null as null | FungibleToken,
  transaction: null as null | Transaction,
  key: null as null | string,
  isZeko: false,
};

// ---------------------------------------------------------------------------------------

const functions = {
  setActiveInstanceToDevnet: async (args: {}) => {
    let currentLocation = self.location.origin;
    const devnet = Mina.Network(
      {
        networkId: "testnet",
        mina: "https://api.minascan.io/node/devnet/v1/graphql",
        archive: 'https://api.minascan.io/archive/devnet/v1/graphql'
      }
    );
    state.isZeko = false;
    Mina.setActiveInstance(devnet);
  },
  setActiveInstanceToZeko: async (args: {}) => {
    const zeko = Mina.Network(
      {
        networkId: "testnet",
        mina: "https://devnet.zeko.io/graphql",
        //archive: 'https://api.minascan.io/archive/devnet/v1/graphql'
      }
    );
    state.isZeko = true;
    Mina.setActiveInstance(zeko);
  },

  getActiveInstance: async (args: {}) => {
    return JSON.stringify({ isZeko: state.isZeko });
  },

  loadContract: async (args: {}) => {
    const { PoolMina, MinaTokenHolder, FungibleToken, FungibleTokenAdmin } = await import("../../../contracts/build/src/indexmina");

    state.PoolMina = PoolMina;
    state.PoolMinaHolder = MinaTokenHolder;
    state.TokenStandard = FungibleToken;
    state.TokenAdmin = FungibleTokenAdmin;
  },
  compileContract: async (args: {}) => {
    console.time("compile");
    try {
      // const cacheFiles = await fetchFiles();
      // const cache = readCache(cacheFiles);

      await state.TokenAdmin?.compile({});
      await state.TokenStandard?.compile({});
      await state.PoolMinaHolder!.compile({});
      await state.PoolMina!.compile({});
    } catch (error) {
      console.error("compileContract", error);
    }

    console.timeEnd("compile");
  },
  fetchAccount: async (args: { publicKey58: string }) => {
    const publicKey = PublicKey.fromBase58(args.publicKey58);
    return await fetchAccount({ publicKey });
  },
  fetchAccountToken: async (args: { publicKey58: string }) => {
    const publicKey = PublicKey.fromBase58(args.publicKey58);
    return await fetchAccount({ publicKey, tokenId: state.zkToken?.deriveTokenId() });
  },
  getBalance: async (args: { publicKey58: string }) => {
    const publicKey = PublicKey.fromBase58(args.publicKey58);
    const balance = Mina.getBalance(publicKey);
    return JSON.stringify(balance.toJSON());
  },
  initZkappInstance: async (args: { publicKey58: string }) => {
    const publicKey = PublicKey.fromBase58(args.publicKey58);
    await fetchAccount({ publicKey })
    state.zkapp = new state.PoolMina!(publicKey);
    const token = await state.zkapp.token.fetch();
    await fetchAccount({ publicKey: token })
    state.zkToken = new state.TokenStandard!(token);

    await fetchAccount({ publicKey, tokenId: state.zkToken.deriveTokenId() });
    state.zkHolder = new state.PoolMinaHolder!(publicKey, state.zkToken.deriveTokenId());
  },
  deployPoolInstance: async (args: { tokenX: string }) => {
    const poolKey = PrivateKey.random();
    const pool = new state.PoolMina!(poolKey.toPublicKey());
    console.log("appkey", poolKey.toBase58());
    const tokenKey = PublicKey.fromBase58(args.tokenX);
    const depArgs = { token: tokenKey, symbol: "LUM", src: "https://luminadex.com/" };
    const tokenX = new state.TokenStandard!(tokenKey);
    const holderX = new state.PoolMinaHolder!(poolKey.toPublicKey(), tokenX.deriveTokenId());

    const transaction = await Mina.transaction(async () => {
      await pool.deploy(depArgs);
      await holderX.deploy();
      await tokenX.approveAccountUpdate(holderX.self);
    });
    state.transaction = transaction;
    state.key = poolKey.toBase58();
  },
  getSupply: async (args: {}) => {
    const acc = await fetchAccount({ publicKey: state.zkapp.address, tokenId: state.zkapp?.deriveTokenId() });
    return JSON.stringify(acc.account.balance.toJSON());
  },
  getBalances: async (args: { user: string }) => {
    const publicKey = PublicKey.fromBase58(args.user);
    const accMina = await fetchAccount({ publicKey });
    const acc = await fetchAccount({ publicKey, tokenId: state.zkToken?.deriveTokenId() });
    const accLiquidity = await fetchAccount({ publicKey, tokenId: state.zkapp?.deriveTokenId() });
    const bal = accMina.account ? accMina.account.balance : 0;
    const balToken = acc.account ? acc.account.balance : 0;
    const balLiquidity = accLiquidity.account ? accLiquidity.account.balance : 0;

    return JSON.stringify({ mina: bal, token: balToken, liquidity: balLiquidity });
  },
  getReserves: async (args: {}) => {
    const acc = await fetchAccount({ publicKey: state.zkapp.address });
    const accToken = await fetchAccount({ publicKey: state.zkapp.address, tokenId: state.zkToken?.deriveTokenId() });
    const accLiquidity = await fetchAccount({ publicKey: state.zkapp.address, tokenId: state.zkapp?.deriveTokenId() });
    const amountToken = await accToken.account.balance;
    const amountMina = await acc.account.balance;
    const liquidity = await accLiquidity.account.balance;
    return JSON.stringify({ amountToken, amountMina, liquidity });
  },
  swapFromMinaTransaction: async (args: { user: string, amt: number, minOut: number, balanceOutMin: number, balanceInMax: number }) => {
    const amtIn = Math.trunc(args.amt);
    const amtOut = Math.trunc(args.minOut);
    const balanceOut = Math.trunc(args.balanceOutMin);
    const balanceIn = Math.trunc(args.balanceInMax);



    const publicKey = PublicKey.fromBase58(args.user);
    await fetchAccount({ publicKey: state.zkapp.address });
    await fetchAccount({ publicKey: state.zkapp.address, tokenId: state.zkToken.deriveTokenId() });
    await fetchAccount({ publicKey });
    const acc = await fetchAccount({ publicKey, tokenId: state.zkToken?.deriveTokenId() });

    let newAcc = acc.account ? 0 : 1;
    const token = await state.zkapp?.token.fetch();
    console.log("token", token?.toBase58());
    const transaction = await Mina.transaction(publicKey, async () => {
      AccountUpdate.fundNewAccount(publicKey, newAcc);
      await state.zkHolder!.swapFromMina(UInt64.from(amtIn), UInt64.from(amtOut), UInt64.from(balanceIn), UInt64.from(balanceOut));
      await state.zkToken?.approveAccountUpdate(state.zkHolder.self);
    });
    state.transaction = transaction;

    await state.transaction!.prove();
  },
  swapFromTokenTransaction: async (args: { user: string, amt: number, minOut: number, balanceOutMin: number, balanceInMax: number }) => {
    const amtIn = Math.trunc(args.amt);
    const amtOut = Math.trunc(args.minOut);
    const balanceOut = Math.trunc(args.balanceOutMin);
    const balanceIn = Math.trunc(args.balanceInMax);

    const publicKey = PublicKey.fromBase58(args.user);

    await fetchAccount({ publicKey: state.zkapp.address });
    await fetchAccount({ publicKey: state.zkapp.address, tokenId: state.zkToken.deriveTokenId() });
    await fetchAccount({ publicKey });
    await fetchAccount({ publicKey, tokenId: state.zkToken?.deriveTokenId() });

    const token = await state.zkapp?.token.fetch();
    console.log("token", token?.toBase58());
    const transaction = await Mina.transaction(publicKey, async () => {
      await state.zkapp!.swapFromToken(UInt64.from(amtIn), UInt64.from(amtOut), UInt64.from(balanceIn), UInt64.from(balanceOut));
    });
    state.transaction = transaction;

    await state.transaction!.prove();
  },
  addLiquidity: async (args: { user: string, amtMina: number, amtToken: number, reserveMinaMax: number, reserveTokenMax: number, supplyMin: number }) => {
    const amtMinaIn = Math.trunc(args.amtMina);
    const amtTokenIn = Math.trunc(args.amtToken);
    const reserveMina = Math.trunc(args.reserveMinaMax);
    const reserveToken = Math.trunc(args.reserveTokenMax);
    const supply = Math.trunc(args.supplyMin);

    const publicKey = PublicKey.fromBase58(args.user);

    await fetchAccount({ publicKey: state.zkapp.address });
    await fetchAccount({ publicKey: state.zkapp.address, tokenId: state.zkToken.deriveTokenId() });
    await fetchAccount({ publicKey });
    await fetchAccount({ publicKey, tokenId: state.zkToken?.deriveTokenId() });

    console.log("add liquidity");
    const acc = await fetchAccount({ publicKey, tokenId: state.zkapp?.deriveTokenId() });
    let newAcc = acc.account ? 0 : 1;
    const transaction = await Mina.transaction(publicKey, async () => {
      AccountUpdate.fundNewAccount(publicKey, newAcc);
      await state.zkapp!.supplyLiquidity(UInt64.from(amtMinaIn), UInt64.from(amtTokenIn), UInt64.from(reserveMina), UInt64.from(reserveToken), UInt64.from(supply));
    });
    state.transaction = transaction;

    await state.transaction!.prove();
  },

  withdrawLiquidity: async (args: { user: string, liquidityAmount: number, amountMinaMin: number, amountTokenMin: number, reserveMinaMin: number, reserveTokenMin: number, supplyMax: number }) => {
    const liquidityAmountIn = Math.trunc(args.liquidityAmount);
    const amountMinaOut = Math.trunc(args.amountMinaMin);
    const amountTokenOut = Math.trunc(args.amountTokenMin);
    const reserveMina = Math.trunc(args.reserveMinaMin);
    const reserveToken = Math.trunc(args.reserveTokenMin);
    const supply = Math.trunc(args.supplyMax);

    const publicKey = PublicKey.fromBase58(args.user);

    await fetchAccount({ publicKey: state.zkapp.address });
    await fetchAccount({ publicKey: state.zkapp.address, tokenId: state.zkToken.deriveTokenId() });
    await fetchAccount({ publicKey });
    await fetchAccount({ publicKey, tokenId: state.zkToken?.deriveTokenId() });
    await fetchAccount({ publicKey, tokenId: state.zkapp?.deriveTokenId() });

    console.log("withdraw liquidity");

    const transaction = await Mina.transaction(publicKey, async () => {
      await state.zkHolder!.withdrawLiquidity(UInt64.from(liquidityAmountIn), UInt64.from(amountMinaOut), UInt64.from(amountTokenOut), UInt64.from(reserveMina), UInt64.from(reserveToken), UInt64.from(supply));
      await state.zkToken.approveAccountUpdate(state.zkHolder.self);
    });
    state.transaction = transaction;

    await state.transaction!.prove();
  },
  getTransactionJSON: async (args: {}) => {
    return state.transaction!.toJSON();
  },
  getKey: async (args: {}) => {
    return state.key;
  },
};

// ---------------------------------------------------------------------------------------

export type WorkerFunctions = keyof typeof functions;

export type ZkappWorkerRequest = {
  id: number;
  fn: WorkerFunctions;
  args: any;
};

export type ZkappWorkerReponse = {
  id: number;
  data: any;
};

if (typeof window !== "undefined") {
  addEventListener(
    "message",
    async (event: MessageEvent<ZkappWorkerRequest>) => {
      const returnData = await functions[event.data.fn](event.data.args);

      console.log("worker return data", returnData);
      const message: ZkappWorkerReponse = {
        id: event.data.id,
        data: returnData,
      };
      postMessage(message);
    }
  );
}

console.log('Web Worker Successfully Initialized.');
