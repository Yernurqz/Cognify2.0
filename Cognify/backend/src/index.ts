import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Initialize Prisma
const prisma = new PrismaClient();

// Initialize Redis
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

redis.on('connect', () => {
    console.log('Connected to Redis');
});

redis.on('error', (err) => {
    console.error('Redis connection error:', err);
});

// Middleware
app.use(cors());
app.use(express.json());

// Basic Route
app.get('/api/health', async (req, res) => {
    try {
        // Quick DB check
        await prisma.$queryRaw`SELECT 1`;
        
        // Quick Redis check
        await redis.set('healthcheck', 'ok', 'EX', 10);
        const redisVal = await redis.get('healthcheck');

        res.json({ 
            status: 'ok', 
            database: 'connected', 
            redis: redisVal === 'ok' ? 'connected' : 'error' 
        });
    } catch (error) {
        console.error('Healthcheck failed:', error);
        res.status(500).json({ status: 'error', message: 'Service checks failed' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
