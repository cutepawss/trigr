import app from './app';
import { config } from './config';
import logger from './lib/logger';
import prisma from './lib/prisma';
import { getReactiveEngine } from './services/reactive-engine.service';

// Initialize reactive execution engine
const reactiveEngine = getReactiveEngine();

const server = app.listen(config.port, () => {
    logger.info(`Server started on port ${config.port}`);
    logger.info(`Environment: ${config.nodeEnv}`);
    logger.info(`API URL: http://localhost:${config.port}`);

    // Start the reactive execution engine
    reactiveEngine.start();
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully');

    // Stop reactive engine first
    await reactiveEngine.stop();

    server.close(async () => {
        logger.info('HTTP server closed');

        await prisma.$disconnect();
        logger.info('Database connection closed');

        process.exit(0);
    });
});

process.on('SIGINT', async () => {
    logger.info('SIGINT received, shutting down gracefully');

    // Stop reactive engine first
    await reactiveEngine.stop();

    server.close(async () => {
        logger.info('HTTP server closed');

        await prisma.$disconnect();
        logger.info('Database connection closed');

        process.exit(0);
    });
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection', { reason, promise });
});

process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
    process.exit(1);
});

// Export engine for use in routes
export { reactiveEngine };
