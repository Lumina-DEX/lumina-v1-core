import { AccountUpdate, Mina, PrivateKey, PublicKey } from 'o1js';
import { DexToken, DexTokenHolder, TokenDex } from '../index.js';
import fs from 'fs/promises';
// Usage:
// node build/src/deploy/deployPool.js

const tokenXAddress = "B62qjZ1W2ybx2AYLYUyjPMoBT6Kn6CPPjAN2WWSRKH46uGgn2SgeNtK";
const tokenYAddress = "B62qkSPqDx2TazHm6PxdqXSb7DiVfvt7UM17ykK3xb3VSPjKLPbYWdb";

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
let config = configJson.deployAliases["dex"];
let feepayerKeysBase58: { privateKey: string; publicKey: string } = JSON.parse(
    await fs.readFile(config.feepayerKeyPath, 'utf8')
);
let feepayerKey = PrivateKey.fromBase58(feepayerKeysBase58.privateKey);

await TokenDex.compile();
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

const senderKey = feepayerKey;
const fee = 0.1 * 1e9;
const transaction = await Mina.transaction({ sender: senderKey.toPublicKey(), fee }, async () => {
    AccountUpdate.fundNewAccount(senderKey.toPublicKey(), 1);
    await pool.deploy();
});
await transaction.prove();
const sentTx = await transaction.sign([senderKey, poolKey]).send();

const key = poolKey.toBase58();

console.log("data", { key, sentTx });