import { Router } from 'express';
import authRoutes from './auth.routes';
import projectsRoutes from './projects.routes';
import workflowsRoutes from './workflows.routes';
import deploymentsRoutes from './deployments.routes';
import intentsRoutes from './intents.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/projects', projectsRoutes);
router.use('/workflows', workflowsRoutes);
router.use('/deployments', deploymentsRoutes);
router.use('/intents', intentsRoutes);

export default router;
