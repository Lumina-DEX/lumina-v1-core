import { Queue, Worker, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';

import { AccountUpdate, Cache, fetchAccount, Mina, PublicKey, setNumberOfWorkers, UInt64 } from 'o1js';
import { PoolMina, PoolTokenHolder, FungibleToken, FungibleTokenAdmin } from "../dist/src/contracts/indexmina.js";

const connection = new IORedis({ maxRetriesPerRequest: null });

const swapFromMinaQueue = new Queue('swapFromMina', { connection });
const swapFromMinaQueueEvents = new QueueEvents('swapFromMina', { connection });
await swapFromMinaQueue.setGlobalConcurrency(5);


export async function addJobs() {

    const job = await swapFromMinaQueue.add('job', { foo: 'bar' });

    const res = await job.waitUntilFinished(swapFromMinaQueueEvents);

    return res;
    //console.log("res", res);
}

