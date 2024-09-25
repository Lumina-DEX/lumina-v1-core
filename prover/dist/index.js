"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const prove_1 = require("./api/prove");
// configures dotenv to work in your application
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// using express to parse JSON bodies into JS objects
app.use(express_1.default.json());
// enabling CORS for all requests
app.use((0, cors_1.default)());
app.use("/api/swap", prove_1.proveRouter);
// added root redirect
app.get(`/`, async (req, res) => {
    res.redirect('/api');
});
// added the api route
app.get(`/api`, async (req, res) => {
    res.json({ up: true });
});
app.listen(PORT, () => {
    console.log("Server running at PORT: ", PORT);
}).on("error", (error) => {
    // gracefully handle error
    throw new Error(error.message);
});
