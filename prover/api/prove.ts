import express from 'express';
import { Worker } from 'worker_threads';

export const proveRouter = express.Router();



proveRouter.get('/', async function (req, res) {
    try {
        const fib = await computeFibonacci(30);
        res.send(JSON.stringify({ msg: "hello swap", fib: fib }));
    } catch (e) {
        console.error(e)
        res.status(409).json({
            error: 'No records found!',
        });
    }
});

const computeFibonacci = (num: any) => {
    return new Promise((resolve, reject) => {
        const worker = new Worker('./worker.js', { workerData: num });
        worker.postMessage("eddy");
        worker.on('message', resolve);
        worker.on('error', reject);
        worker.on('exit', (code) => {
            if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
        });
    });
};

