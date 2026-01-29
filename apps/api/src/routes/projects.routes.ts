import { Router } from 'express';
import { projectSchemas } from '@rialo-builder/shared';
import { ProjectService } from '../services/project.service';
import { validate } from '../middleware/validation.middleware';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = Router();
const projectService = new ProjectService();

router.use(authenticate);

router.post('/', validate(projectSchemas.createProjectSchema), async (req: AuthRequest, res, next) => {
    try {
        const project = await projectService.create(req.user!.id, req.body);
        res.status(201).json({
            success: true,
            data: project,
        });
    } catch (error: any) {
        next(error);
    }
});

router.get('/', async (req: AuthRequest, res, next) => {
    try {
        const projects = await projectService.findAllByUser(req.user!.id);
        res.json({
            success: true,
            data: projects,
        });
    } catch (error: any) {
        next(error);
    }
});

// Get workflows for a project (must be before /:id to prevent route matching)
router.get('/:id/workflows', async (req: AuthRequest, res, next) => {
    try {
        // First verify the project exists and belongs to the user
        await projectService.findById(req.params.id, req.user!.id);

        // Get workflows for this project using Prisma directly
        const prisma = (projectService as any).prisma || require('../lib/prisma').default;
        const workflows = await prisma.workflow.findMany({
            where: {
                projectId: req.params.id,
                deletedAt: null,
            },
            include: {
                nodes: true,
                edges: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        res.json({
            success: true,
            data: workflows,
        });
    } catch (error: any) {
        if (error.message === 'Project not found') {
            res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Project not found',
                },
            });
        } else {
            next(error);
        }
    }
});

router.get('/:id', async (req: AuthRequest, res, next) => {
    try {
        const project = await projectService.findById(req.params.id, req.user!.id);
        res.json({
            success: true,
            data: project,
        });
    } catch (error: any) {
        if (error.message === 'Project not found') {
            res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Project not found',
                },
            });
        } else {
            next(error);
        }
    }
});

router.patch('/:id', validate(projectSchemas.updateProjectSchema), async (req: AuthRequest, res, next) => {
    try {
        const project = await projectService.update(req.params.id, req.user!.id, req.body);
        res.json({
            success: true,
            data: project,
        });
    } catch (error: any) {
        if (error.message === 'Project not found') {
            res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Project not found',
                },
            });
        } else {
            next(error);
        }
    }
});

router.delete('/:id', async (req: AuthRequest, res, next) => {
    try {
        await projectService.delete(req.params.id, req.user!.id);
        res.json({
            success: true,
            data: { message: 'Project deleted successfully' },
        });
    } catch (error: any) {
        if (error.message === 'Project not found') {
            res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Project not found',
                },
            });
        } else {
            next(error);
        }
    }
});

export default router;
