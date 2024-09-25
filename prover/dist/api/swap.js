"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.swapRouter = void 0;
const express_1 = __importDefault(require("express"));
const worker_threads_1 = require("worker_threads");
exports.swapRouter = express_1.default.Router();
const o1js_1 = require("o1js");
const cache = o1js_1.Cache.FileSystem('./cache');
exports.swapRouter.get('/', function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const fib = yield computeFibonacci(30);
            res.send(JSON.stringify({ msg: "hello swap", fib: fib }));
        }
        catch (e) {
            console.error(e);
            res.status(409).json({
                error: 'No records found!',
            });
        }
    });
});
const computeFibonacci = (num) => {
    return new Promise((resolve, reject) => {
        const worker = new worker_threads_1.Worker('./worker.js', { workerData: num });
        worker.on('message', resolve);
        worker.on('error', reject);
        worker.on('exit', (code) => {
            if (code !== 0)
                reject(new Error(`Worker stopped with exit code ${code}`));
        });
    });
};
