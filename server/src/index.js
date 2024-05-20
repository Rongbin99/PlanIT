import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

import { stocksRouter } from './routes/stocks.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/', stocksRouter);

/*mongoose.connect(
    "mongodb+srv://"
    {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    }
);*/

app.listen(6969, () => {
    console.log('SERVER ACTIVE ON PORT 6969');
})