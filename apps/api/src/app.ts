import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import { generalRateLimiter } from './middleware/rate-limit.middleware';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import routes from './routes';
import logger from './lib/logger';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({ origin: config.cors.origin, credentials: true }));

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Rate limiting
app.use(generalRateLimiter);

// Request logging
app.use((req, _res, next) => {
    logger.info('Request', {
        method: req.method,
        path: req.path,
        ip: req.ip,
    });
    next();
});

// Health check
app.get('/health', (_req, res) => {
    res.json({ success: true, data: { status: 'healthy', timestamp: new Date().toISOString() } });
});

// API routes
app.use('/api', routes);

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
