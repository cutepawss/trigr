import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import logger from '../lib/logger';

export const validate = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            schema.parse(req.body);
            next();
        } catch (error: any) {
            logger.warn('Validation error', { error: error.errors, body: req.body });
            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid request data',
                    details: error.errors,
                },
            });
        }
    };
};
