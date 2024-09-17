import type { NextApiRequest, NextApiResponse } from 'next'
import { PoolMina, PoolMinaDeployProps, MinaTokenHolder, FungibleToken, FungibleTokenAdmin } from "../../../../contracts/build/src/indexmina.js";
import { AccountUpdate, Mina, PrivateKey, PublicKey, Cache, fetchAccount, UInt64 } from "o1js";
import fs, { readFileSync } from 'fs'
import util from 'util';
import { resolve } from 'path';
import { readCache } from '../cache';

export const maxDuration = 300; // This function can run for a maximum of 300 seconds

type ResponseData = {
    message: string
}

type SwapData = { user: string, amountIn: number, amountOut: number, balanceOutMin: number, balanceInMax: number };

const ZKAPP_ADDRESS = 'B62qrn4bTWsKGddKeLGzriYVQF23fNF4tCnACKawP7ySJfH7zFmd2u6';
const ZKTOKEN_ADDRESS = 'B62qjDaZ2wDLkFpt7a7eJme6SAJDuc3R3A2j2DRw7VMmJAFahut7e8w';

const fetchFromServerFiles = async () => {
    const readFile = util.promisify(fs.readFile);
    const data = await readFile("./public/compiled.json", 'utf8');
    const json = JSON.parse(data);

    return Promise.all(json.map((file) => {
        return Promise.all([
            readFile(`./public/cache/${file}.txt`, "binary")
        ]).then(([data]) => ({ file, data }));
    }))
        .then((cacheList) => cacheList.reduce((acc: any, { file, data }) => {
            acc[file] = { file, data };

            return acc;
        }, {}));
}

const FileSystem = (cacheDirectory) => ({
    read({ persistentId, uniqueId, dataType }) {

        // read current uniqueId, return data if it matches
        let currentId = fs.existsSync(resolve(cacheDirectory, `${persistentId}.txt`));
        if (!currentId) {
            console.log("not found : ", persistentId);
            return undefined;
        }

        console.log("load : ", persistentId);
        if (dataType === 'string') {
            let string = readFileSync(resolve(cacheDirectory, `${persistentId}.txt`), 'utf8');
            return new TextEncoder().encode(string);
        }
        else {
            let buffer = readFileSync(resolve(cacheDirectory, `${persistentId}.txt`));
            return new Uint8Array(buffer.buffer);
        }
    },
    write({ persistentId, uniqueId, dataType }, data) {

    },
    canWrite: false
});

let inited = false;

async function init() {
    if (!inited) {
        console.time("compile");
        //const cacheFiles = await fetchFromServerFiles();
        const cache = FileSystem("./public/cache");

        await PoolMina.compile({ cache })
        await MinaTokenHolder.compile({ cache });
        await FungibleTokenAdmin.compile({ cache });
        await FungibleToken.compile({ cache });
        console.timeEnd("compile");

        inited = true;
    }
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<any>
) {
    await init();
    if (req.method === 'POST') {
        const json = req.body;
        const args = json as SwapData;

        console.log("args", args);

        if (args) {

            const Network = Mina.Network({
                networkId: "testnet",
                mina: "https://devnet.zeko.io/graphql"
            });
            Mina.setActiveInstance(Network);

            const poolKey = PublicKey.fromBase58(ZKAPP_ADDRESS);
            console.log("poolKey", poolKey.toBase58());
            const tokenKey = PublicKey.fromBase58(ZKTOKEN_ADDRESS);
            console.log("tokenKey", tokenKey.toBase58());
            const tokenX = new FungibleToken(tokenKey);
            const tokenId = tokenX.deriveTokenId();
            console.log("tokenId", tokenId.toString());
            const holderX = new MinaTokenHolder(poolKey, tokenId);

            const amtIn = Math.trunc(args.amountIn);
            const amtOut = Math.trunc(args.amountOut);
            const balanceOut = Math.trunc(args.balanceOutMin);
            const balanceIn = Math.trunc(args.balanceInMax);
            const userKey = PublicKey.fromBase58(args.user);
            console.log("userKey", userKey.toBase58());
            console.log("data swap", amtIn, amtOut, balanceOut, balanceIn);

            await fetchAccount({ publicKey: poolKey });
            await fetchAccount({ publicKey: poolKey, tokenId: tokenId });
            await fetchAccount({ publicKey: userKey });
            const acc = await fetchAccount({ publicKey: userKey, tokenId: tokenId });
            let newAcc = acc.account ? 0 : 1;

            console.time("prove");
            const transaction = await Mina.transaction(userKey, async () => {
                AccountUpdate.fundNewAccount(userKey, newAcc);
                await holderX.swapFromMina(UInt64.from(amtIn), UInt64.from(amtOut), UInt64.from(balanceIn), UInt64.from(balanceOut));
                await tokenX.approveAccountUpdate(holderX.self);
            });
            await transaction.prove();
            console.timeEnd("prove");

            return res.status(200).json({ transaction: transaction.toJSON() });
        }
        return res.status(500).json({ message: 'Empty data' });
    } else {
        return res.status(404);
    }
}