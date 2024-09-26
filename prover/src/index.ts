import express, { Request, Response } from "express";
import dotenv from "dotenv";
import cors from 'cors';
import { proveRouter } from "./api/prove";

// configures dotenv to work in your application
dotenv.config();
const app = express();

const PORT = process.env.PORT || 3000;

// using express to parse JSON bodies into JS objects
app.use(express.json())

// enabling CORS for all requests
app.use(cors())

app.use("/api/prove", proveRouter);

// added root redirect
app.get(`/`, async (req, res) => {
    res.redirect('/api')
})

// added the api route
app.get(`/api`, async (req, res) => {
    res.json({ up: true })
})


app.listen(PORT, () => {
    console.log("Server running at PORT: ", PORT);
}).on("error", (error) => {
    // gracefully handle error
    throw new Error(error.message);
});