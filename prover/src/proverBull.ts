import { Queue, Worker, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';
import { fileURLToPath } from 'url';

import { AccountUpdate, Cache, fetchAccount, Mina, PublicKey, UInt64 } from 'o1js';
import { PoolMina, PoolTokenHolder, FungibleToken, FungibleTokenAdmin } from "../dist/src/contracts/indexmina.js";
import path from 'path';
import sandbox from './sandbox';

const connection = new IORedis({ maxRetriesPerRequest: null });

const swapFromMinaQueue = new Queue('swapFromMina', { connection });
const swapFromMinaQueueEvents = new QueueEvents('swapFromMina', { connection });

const Network = Mina.Network({
    networkId: "testnet",
    mina: "https://api.minascan.io/node/devnet/v1/graphql"
});
Mina.setActiveInstance(Network);


export async function addJobs() {

    Mina.setActiveInstance(Network);
    const job = await swapFromMinaQueue.add('job', { foo: 'bar' });

    const res = await job.waitUntilFinished(swapFromMinaQueueEvents);

    //console.log("res", res);
}


// const filename = fileURLToPath(import.meta.url);

// const dirname = path.dirname(filename);
// console.log("__dirname", dirname);
// const processorFile = path.join(dirname, "sandbox.ts");
// console.log("file", processorFile);

new Worker('swapFromMina', sandbox, { connection, useWorkerThreads: true });