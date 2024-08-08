import { Mina, PrivateKey, PublicKey, UInt64, fetchAccount } from "o1js";

type Transaction = Awaited<ReturnType<typeof Mina.transaction>>;

// ---------------------------------------------------------------------------------------

import { DexToken, DexTokenHolder } from "../../../contracts/build/src/DexToken";

const state = {
  DexToken: null as null | typeof DexToken,
  DexTokenHolder: null as null | typeof DexTokenHolder,
  zkapp: null as null | DexToken,
  zkHolder1: null as null | DexTokenHolder,
  zkHolder2: null as null | DexTokenHolder,
  transaction: null as null | Transaction,
  key: null as null | string,
};

// ---------------------------------------------------------------------------------------

const functions = {
  setActiveInstanceToBerkeley: async (args: {}) => {
    const Berkeley = Mina.Network(
      "https://api.minascan.io/node/devnet/v1/graphql"
    );
    Mina.setActiveInstance(Berkeley);
  },
  loadContract: async (args: {}) => {
    const { DexToken, DexTokenHolder } = await import("../../../contracts/build/src/DexToken.js");

    state.DexToken = DexToken;
    state.DexTokenHolder = DexTokenHolder;
  },
  compileContract: async (args: {}) => {

    await state.DexTokenHolder?.compile();
    await state.DexToken!.compile();
  },
  fetchAccount: async (args: { publicKey58: string }) => {
    const publicKey = PublicKey.fromBase58(args.publicKey58);
    return await fetchAccount({ publicKey });
  },
  getBalance: async (args: { publicKey58: string }) => {
    const publicKey = PublicKey.fromBase58(args.publicKey58);
    const balance = Mina.getBalance(publicKey);
    return JSON.stringify(balance.toJSON());
  },
  initZkappInstance: async (args: { publicKey58: string }) => {
    const publicKey = PublicKey.fromBase58(args.publicKey58);
    state.zkapp = new state.DexToken!(publicKey);
  },
  deployPoolInstance: async (args: { app: string, tokenX: string, tokenY: string }) => {
    const poolKey = PrivateKey.random();
    const pool = new DexToken(poolKey.toPublicKey());
    console.log("appkey", poolKey.toBase58());
    pool.tokenX = PublicKey.fromBase58(args.tokenX);
    pool.tokenY = PublicKey.fromBase58(args.tokenY);
    const tokenX = new DexToken(pool.tokenX);
    const tokenY = new DexToken(pool.tokenY)
    const holderX = new DexTokenHolder(poolKey.toPublicKey(), tokenX.deriveTokenId());
    const holderY = new DexTokenHolder(poolKey.toPublicKey(), tokenY.deriveTokenId());
    const transaction = await Mina.transaction(async () => {
      pool.deploy();
      holderX.deploy();
      holderY.deploy();
      tokenX.approveAccountUpdate(holderX.self);
      tokenY.approveAccountUpdate(holderY.self);
    });
    state.transaction = transaction;
    state.key = poolKey.toBase58();
  },
  getNum: async (args: {}) => {
    const currentNum = await state.zkapp!.totalSupply.get();
    return JSON.stringify(currentNum.toJSON());
  },
  createUpdateTransaction: async (args: {}) => {
    const transaction = await Mina.transaction(async () => {
      state.zkapp!.supplyLiquidity(UInt64.zero);
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

      const message: ZkappWorkerReponse = {
        id: event.data.id,
        data: returnData,
      };
      postMessage(message);
    }
  );
}
