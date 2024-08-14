import { Account, AccountUpdate, Bool, Mina, PrivateKey, PublicKey, UInt32, UInt64, fetchAccount } from "o1js";
import { PoolMina, PoolMinaDeployProps, MinaTokenHolder, TokenStandard } from "../../../contracts/build/src/index.js";

type Transaction = Awaited<ReturnType<typeof Mina.transaction>>;

// ---------------------------------------------------------------------------------------

const state = {
  TokenStandard: null as null | typeof TokenStandard,
  PoolMina: null as null | typeof PoolMina,
  PoolMinaHolder: null as null | typeof MinaTokenHolder,
  zkapp: null as null | PoolMina,
  zkHolder: null as null | MinaTokenHolder,
  zkToken: null as null | TokenStandard,
  transaction: null as null | Transaction,
  key: null as null | string,
};

// ---------------------------------------------------------------------------------------

const functions = {
  setActiveInstanceToBerkeley: async (args: {}) => {
    const Berkeley = Mina.Network(
      {
        networkId: "testnet",
        mina: "https://api.minascan.io/node/devnet/v1/graphql",
        archive: 'https://api.minascan.io/archive/devnet/v1/graphql'
      }
    );
    Mina.setActiveInstance(Berkeley);
  },
  loadContract: async (args: {}) => {
    const { PoolMina, MinaTokenHolder, TokenStandard } = await import("../../../contracts/build/src/index.js");

    state.PoolMina = PoolMina;
    state.PoolMinaHolder = MinaTokenHolder;
    state.TokenStandard = TokenStandard;
  },
  compileContract: async (args: {}) => {
    await state.TokenStandard?.compile();
    await state.PoolMinaHolder?.compile();
    await state.PoolMina!.compile();
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
  },
  deployPoolInstance: async (args: { app: string, tokenX: string, tokenY: string }) => {
    const poolKey = PrivateKey.random();
    const pool = new PoolMina(poolKey.toPublicKey());
    console.log("appkey", poolKey.toBase58());
    const tokenKey = PublicKey.fromBase58(args.tokenX);
    const depArgs: PoolMinaDeployProps = { token: tokenKey };
    const tokenX = new TokenStandard(tokenKey);
    const holderX = new MinaTokenHolder(poolKey.toPublicKey(), tokenX.deriveTokenId());

    const transaction = await Mina.transaction(async () => {
      pool.deploy(depArgs);
      holderX.deploy();
      tokenX.approveAccountUpdate(holderX.self);
    });
    state.transaction = transaction;
    state.key = poolKey.toBase58();
  },
  getSupply: async (args: {}) => {
    const currentNum = await state.zkapp!.liquiditySupply.get();
    return JSON.stringify(currentNum.toJSON());
  },
  getReserves: async (args: {}) => {
    const amountToken = await state.zkapp!.reserveToken.get();
    const amountMina = await state.zkapp!.reserveMina.get();
    return JSON.stringify({ amountToken, amountMina });
  },
  swapFromMinaTransaction: async (args: { user: string, amt: number, minOut: number }) => {
    const amtIn = args.amt * 10 ** 9;
    const amtOut = args.minOut * 10 ** 9;

    const publicKey = PublicKey.fromBase58(args.user);
    const acc = await fetchAccount({ publicKey, tokenId: state.zkToken?.deriveTokenId() });
    let newAcc = acc.account?.nonce.equals(UInt32.zero).toBoolean() ? 1 : 0;
    const transaction = await Mina.transaction(async () => {
      AccountUpdate.fundNewAccount(publicKey, newAcc);
      state.zkapp!.swapFromMina(UInt64.from(amtIn), UInt64.from(amtOut));
    });
    state.transaction = transaction;

    await state.transaction!.prove();
  },
  swapFromTokenTransaction: async (args: { user: string, amt: number, minOut: number }) => {
    const amtIn = args.amt * 10 ** 9;
    const amtOut = args.minOut * 10 ** 9;
    const transaction = await Mina.transaction(async () => {
      state.zkapp!.swapFromToken(UInt64.from(amtIn), UInt64.from(amtOut));
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
