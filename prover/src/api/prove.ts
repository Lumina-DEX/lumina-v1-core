import express from 'express';
import { Worker } from 'worker_threads';
import ZkappWorkerClient from '../workerClient';

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


async function timeout(seconds: number): Promise<void> {
    return new Promise<void>((resolve) => {
        setTimeout(() => {
            resolve();
        }, seconds * 1000);
    });
}

