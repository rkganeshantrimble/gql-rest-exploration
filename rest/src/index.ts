import { getAccountData, getUserData } from './services/profileService.js';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
const app = express();
dotenv.config();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

import { default as accounts } from './routes/accounts';
app.use('/account', accounts);

app.listen(8082, () => {
  console.log(`App is listening at Port:8082`);
});
