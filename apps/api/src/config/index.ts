import dotenv from 'dotenv';

dotenv.config();

export const config = {
    port: parseInt(process.env.API_PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',

    jwt: {
        secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
        expiresIn: process.env.JWT_EXPIRES_IN || '15m',
        refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
    },

    cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    },

    rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 1000, // Increased for development
        maxAuthRequests: 1000, // Increased for development testing
    },

    rialo: {
        rpcEndpoint: process.env.RIALO_RPC_ENDPOINT || 'https://rpc.rialo.network',
        networkId: process.env.RIALO_NETWORK_ID || 'testnet',
    },
};
