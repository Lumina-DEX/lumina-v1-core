import express from 'express';
import { Worker } from 'worker_threads';
import ZkappWorkerClient from '../workerClient';
import { AccountUpdate, Bool, Cache, fetchAccount, Field, Mina, NetworkId, PrivateKey, PublicKey, SmartContract, UInt64, UInt8 } from 'o1js';

export const proveRouter = express.Router();


proveRouter.get('/', async function (req, res) {
    try {
        console.log('Loading web worker...');
        const client = new ZkappWorkerClient();
        await timeout(1);
        console.log('Done loading web worker');
        await client.setActiveInstanceToDevnet();
        await client.loadContract();
        console.log('Compiling zkApp...');
        await client.compileContract()
        console.log('zkApp compiled');

        const fib = await client.getReserves("B62qisgt5S7LwrBKEc8wvWNjW7SGTQjMZJTDL2N6FmZSVGrWiNkV21H");
        res.send(JSON.stringify({ msg: "hello swap", fib: fib }));
    } catch (e) {
        console.error(e)
        res.status(409).json({
            error: 'No records found!',
        });
    }
});

proveRouter.get('/toto', async function (req, res) {
    try {
        const { PoolFactory, PoolMina, PoolTokenHolder, FungibleToken, FungibleTokenAdmin, Faucet } = await import("@/contracts/indexmina");
        console.log('Compiling zkApp...');
        //const cache = Cache.FileSystem('./cache');        
        await FungibleTokenAdmin.compile({});
        await FungibleToken.compile({});
        await PoolFactory.compile({});
        await PoolMina.compile({});
        await PoolTokenHolder.compile({});

        console.log('zkApp compiled');

        const key = PublicKey.fromBase58("B62qisgt5S7LwrBKEc8wvWNjW7SGTQjMZJTDL2N6FmZSVGrWiNkV21H");
        const pool = new PoolMina(key);

        const fib = await pool.token.fetch();
        res.send(JSON.stringify({ msg: "hello swap", fib: fib.toBase58() }));

    } catch (e) {
        console.error(e)
        res.status(409).json({
            error: 'No records found!',
        });
    }
});


async function timeout(seconds: number): Promise<void> {
    return new Promise<void>((resolve) => {
        setTimeout(() => {
            resolve();
        }, seconds * 1000);
    });
}

