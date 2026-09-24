import { config } from 'dotenv';
config();

import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.config.js';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));
app.use(express.json());

app.listen(port, () => {
    connectDB();
    console.log(`Server is running on port ${port}`);
})