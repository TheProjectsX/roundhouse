import express from 'express';
import cors from 'cors';

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({ message: 'Express + TypeScript + CORS is running.' });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});