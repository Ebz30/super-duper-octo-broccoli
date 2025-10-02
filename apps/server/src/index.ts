import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { PrismaClient } from '@prisma/client';
import http from 'http';
import { WebSocketServer } from 'ws';

const app = express();
const server = http.createServer(app);
const prisma = new PrismaClient();

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

app.get('/health', (_req, res) => res.json({ ok: true }));

// Placeholder routes (to be implemented)
app.get('/', (_req, res) => res.json({ name: 'MyBazaar API' }));

// WebSocket server placeholder
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: 'welcome' }));
});

const PORT = Number(process.env.PORT || 5000);
server.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
