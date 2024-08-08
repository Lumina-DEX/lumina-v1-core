import { DexToken, DexTokenHolder } from "../../../../contracts/build/src/DexToken";
import { AccountUpdate, Mina, PrivateKey, PublicKey } from "o1js";

await DexTokenHolder.compile()
await DexToken.compile();

export async function POST(
    req: Request
) {
    const json = await req.json();
    const tokenXAddress = json.tokenX as string;
    const tokenYAddress = json.tokenY as string;

    if (tokenXAddress && tokenYAddress) {
        const Network = Mina.Network({
            networkId: "testnet",
            mina: "https://api.minascan.io/node/devnet/v1/graphql"
        });
        Mina.setActiveInstance(Network);

        const poolKey = PrivateKey.random();
        const pool = new DexToken(poolKey.toPublicKey());
        console.log("appkey", poolKey.toBase58());
        pool.tokenX = PublicKey.fromBase58(tokenXAddress);
        pool.tokenY = PublicKey.fromBase58(tokenYAddress);
        const tokenX = new DexToken(pool.tokenX);
        const tokenY = new DexToken(pool.tokenY)
        const holderX = new DexTokenHolder(poolKey.toPublicKey(), tokenX.deriveTokenId());
        const holderY = new DexTokenHolder(poolKey.toPublicKey(), tokenY.deriveTokenId());

        const senderKey = PrivateKey.fromBase58("");
        const transaction = await Mina.transaction({ sender: senderKey.toPublicKey(), fee: 0.1 }, async () => {
            AccountUpdate.fundNewAccount(senderKey.toPublicKey(), 3);
            pool.deploy();
            holderX.deploy();
            holderY.deploy();
            tokenX.approveAccountUpdate(holderX.self);
            tokenY.approveAccountUpdate(holderY.self);
        });
        await transaction.prove();
        const sentTx = await transaction.sign([senderKey, poolKey]).send();

        const key = poolKey.toBase58();

        return { key, hash: sentTx.hash }
    }
    throw new Error('token address empty');
}