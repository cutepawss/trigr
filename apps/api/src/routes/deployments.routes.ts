import { Router } from 'express';
import { DeploymentService } from '../services/deployment.service';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = Router();
const deploymentService = new DeploymentService();

router.use(authenticate);

router.get('/:id', async (req: AuthRequest, res, next) => {
    try {
        const deployment = await deploymentService.getDeploymentStatus(req.params.id, req.user!.id);
        res.json({ success: true, data: deployment });
    } catch (error: any) {
        if (error.message === 'Deployment not found') {
            res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Deployment not found' } });
        } else {
            next(error);
        }
    }
});

router.get('/:id/executions', async (req: AuthRequest, res, next) => {
    try {
        const cursor = req.query.cursor as string | undefined;
        const executions = await deploymentService.getExecutions(req.params.id, req.user!.id, cursor);
        res.json({ success: true, data: executions });
    } catch (error: any) {
        if (error.message === 'Deployment not found') {
            res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Deployment not found' } });
        } else {
            next(error);
        }
    }
});

export default router;
