import { parentPort, workerData } from 'worker_threads';
import { Cache } from 'o1js';

// const cache = Cache.FileSystem('./cache');

const fibonacci: any = (n: any) => {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
};


const dependency = (data: any) => {
    console.log("data", data);
    if (data) {

        return data;
    }
    return data;
}


parentPort?.addEventListener("message",
    async (event: any) => {
        console.log("event", event);
        parentPort?.postMessage(dependency(workerData));
    }

);