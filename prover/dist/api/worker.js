"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const worker_threads_1 = require("worker_threads");
const fibonacci = (n) => {
    if (n <= 1)
        return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
};
worker_threads_1.parentPort === null || worker_threads_1.parentPort === void 0 ? void 0 : worker_threads_1.parentPort.postMessage(fibonacci(worker_threads_1.workerData));
