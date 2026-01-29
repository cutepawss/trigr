import { Router } from 'express';
import { workflowSchemas, nodeSchemas } from '@rialo-builder/shared';
import { WorkflowService } from '../services/workflow.service';
import { ValidationService } from '../services/validation.service';
import { CompilationService } from '../services/compilation.service';
import { GasEstimationService } from '../services/gas-estimation.service';
import { SimulationService } from '../services/simulation.service';
import { DeploymentService } from '../services/deployment.service';
import { validate } from '../middleware/validation.middleware';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import prisma from '../lib/prisma';

const router = Router();
const workflowService = new WorkflowService();
const validationService = new ValidationService();
const compilationService = new CompilationService();
const gasEstimationService = new GasEstimationService();
const simulationService = new SimulationService();
const deploymentService = new DeploymentService();

router.use(authenticate);

// Create workflow
router.post(
    '/projects/:projectId/workflows',
    validate(workflowSchemas.createWorkflowSchema),
    async (req: AuthRequest, res, next) => {
        try {
            const workflow = await workflowService.create(req.params.projectId, req.user!.id, req.body);
            res.status(201).json({ success: true, data: workflow });
        } catch (error: any) {
            if (error.message === 'Project not found') {
                res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Project not found' } });
            } else {
                next(error);
            }
        }
    }
);

// List workflows by project
router.get('/projects/:projectId/workflows', async (req: AuthRequest, res, next) => {
    try {
        const workflows = await workflowService.findAllByProject(req.params.projectId, req.user!.id);
        res.json({ success: true, data: workflows });
    } catch (error: any) {
        if (error.message === 'Project not found') {
            res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Project not found' } });
        } else {
            next(error);
        }
    }
});

// Get workflow by ID
router.get('/:id', async (req: AuthRequest, res, next) => {
    try {
        const workflow = await workflowService.findById(req.params.id, req.user!.id);
        res.json({ success: true, data: workflow });
    } catch (error: any) {
        if (error.message === 'Workflow not found') {
            res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Workflow not found' } });
        } else {
            next(error);
        }
    }
});

// Update workflow
router.patch(
    '/:id',
    validate(workflowSchemas.updateWorkflowSchema),
    async (req: AuthRequest, res, next) => {
        try {
            const workflow = await workflowService.update(req.params.id, req.user!.id, req.body);
            res.json({ success: true, data: workflow });
        } catch (error: any) {
            if (error.message === 'Workflow not found') {
                res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Workflow not found' } });
            } else {
                next(error);
            }
        }
    }
);

// Delete workflow
router.delete('/:id', async (req: AuthRequest, res, next) => {
    try {
        await workflowService.delete(req.params.id, req.user!.id);
        res.json({ success: true, data: { message: 'Workflow deleted successfully' } });
    } catch (error: any) {
        if (error.message === 'Workflow not found') {
            res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Workflow not found' } });
        } else {
            next(error);
        }
    }
});

// Node operations
router.post('/:id/nodes', validate(nodeSchemas.createNodeSchema), async (req: AuthRequest, res, next) => {
    try {
        const node = await workflowService.createNode(req.params.id, req.user!.id, req.body);
        res.status(201).json({ success: true, data: node });
    } catch (error: any) {
        next(error);
    }
});

router.patch('/:id/nodes/:nodeId', validate(nodeSchemas.updateNodeSchema), async (req: AuthRequest, res, next) => {
    try {
        const node = await workflowService.updateNode(req.params.id, req.params.nodeId, req.user!.id, req.body);
        res.json({ success: true, data: node });
    } catch (error: any) {
        next(error);
    }
});

router.delete('/:id/nodes/:nodeId', async (req: AuthRequest, res, next) => {
    try {
        await workflowService.deleteNode(req.params.id, req.params.nodeId, req.user!.id);
        res.json({ success: true, data: { message: 'Node deleted successfully' } });
    } catch (error: any) {
        next(error);
    }
});

// Edge operations
router.post('/:id/edges', validate(nodeSchemas.createEdgeSchema), async (req: AuthRequest, res, next) => {
    try {
        const edge = await workflowService.createEdge(req.params.id, req.user!.id, req.body);
        res.status(201).json({ success: true, data: edge });
    } catch (error: any) {
        next(error);
    }
});

router.delete('/:id/edges/:edgeId', async (req: AuthRequest, res, next) => {
    try {
        await workflowService.deleteEdge(req.params.id, req.params.edgeId, req.user!.id);
        res.json({ success: true, data: { message: 'Edge deleted successfully' } });
    } catch (error: any) {
        next(error);
    }
});

// Workflow operations
router.post('/:id/validate', async (req: AuthRequest, res, next) => {
    try {
        const workflow = await workflowService.findById(req.params.id, req.user!.id);
        const validationResult = validationService.validate(workflow.nodes || [], workflow.edges || []);

        await prisma.workflow.update({
            where: { id: req.params.id },
            data: { status: validationResult.isValid ? 'valid' : 'invalid' },
        });

        res.json({ success: true, data: validationResult });
    } catch (error: any) {
        next(error);
    }
});

router.post('/:id/estimate-gas', async (req: AuthRequest, res, next) => {
    try {
        const workflow = await workflowService.findById(req.params.id, req.user!.id);
        const compiled = compilationService.compile(workflow.nodes || [], workflow.edges || []);
        const gasEstimate = gasEstimationService.estimate(compiled);

        await prisma.gasEstimate.create({
            data: {
                workflowId: req.params.id,
                estimatedGas: gasEstimate.total,
                breakdown: gasEstimate.breakdown as any,
            },
        });

        res.json({ success: true, data: gasEstimate });
    } catch (error: any) {
        next(error);
    }
});

router.post('/:id/generate-code', async (req: AuthRequest, res, next) => {
    try {
        const workflow = await workflowService.findById(req.params.id, req.user!.id);
        const compiled = compilationService.compile(workflow.nodes || [], workflow.edges || []);
        const code = compilationService.generateCode(compiled);

        await prisma.compiledArtifact.create({
            data: {
                workflowId: req.params.id,
                artifactType: 'rust',
                content: code,
            },
        });

        res.json({ success: true, data: { code, language: 'rust' } });
    } catch (error: any) {
        next(error);
    }
});

router.post('/:id/simulate', async (req: AuthRequest, res, next) => {
    try {
        const workflow = await workflowService.findById(req.params.id, req.user!.id);
        const compiled = compilationService.compile(workflow.nodes || [], workflow.edges || []);
        const simulationResult = simulationService.simulate(compiled, req.body);

        res.json({ success: true, data: simulationResult });
    } catch (error: any) {
        next(error);
    }
});

router.post('/:id/deploy', async (req: AuthRequest, res, next) => {
    try {
        const workflow = await workflowService.findById(req.params.id, req.user!.id);
        const compiled = compilationService.compile(workflow.nodes || [], workflow.edges || []);
        const code = compilationService.generateCode(compiled);

        const deployment = await deploymentService.deploy(req.params.id, req.user!.id, code);

        res.status(201).json({ success: true, data: deployment });
    } catch (error: any) {
        next(error);
    }
});

export default router;
