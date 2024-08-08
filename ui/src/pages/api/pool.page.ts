import type { NextApiRequest, NextApiResponse } from 'next'
import { DexToken, DexTokenHolder } from "../../contracts/DexToken";
import { AccountUpdate, Mina, PrivateKey, PublicKey } from "o1js";
import { NextRequest } from 'next/server';
import { Json } from 'o1js/dist/node/bindings/mina-transaction/gen/transaction-bigint';

type ResponseData = {
    message: string
}


export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ResponseData>
) {
    if (req.method === 'POST') {
        const json = req.body;
        const tokenXAddress = json.tokenX as string;
        const tokenYAddress = json.tokenY as string;


        if (tokenXAddress && tokenYAddress) {
            await DexTokenHolder.compile()
            await DexToken.compile();

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

            const senderKey = PrivateKey.fromBase58(process.env.FEE_PAYER!);
            const fee = 0.1 * 1e9;
            const transaction = await Mina.transaction({ sender: senderKey.toPublicKey() }, async () => {
                AccountUpdate.fundNewAccount(senderKey.toPublicKey(), 3);
                await pool.deploy();
                await holderX.deploy();
                await holderY.deploy();
                await tokenX.approveAccountUpdate(holderX.self);
                await tokenY.approveAccountUpdate(holderY.self);
            });
            await transaction.prove();
            const sentTx = await transaction.sign([senderKey, poolKey]).send();

            const key = poolKey.toBase58();

            return { key, hash: sentTx.hash }
        }
        return res.status(500).json({ message: 'token address empty' });
    } else {
        return res.status(404);
    }
}