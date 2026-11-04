import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRouter from './routes/auth.js';
import usersRouter from './routes/users.js';
import novelsRouter from './routes/novels.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/novels', novelsRouter);

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
