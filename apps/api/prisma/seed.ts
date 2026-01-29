import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database...');

    // Create demo user
    const passwordHash = await bcrypt.hash('Demo123!', 10);

    const user = await prisma.user.upsert({
        where: { email: 'demo@example.com' },
        update: {},
        create: {
            email: 'demo@example.com',
            passwordHash,
        },
    });

    console.log('Created demo user:', user.email);

    // Create demo project
    const project = await prisma.project.upsert({
        where: { id: '00000000-0000-0000-0000-000000000001' },
        update: {},
        create: {
            id: '00000000-0000-0000-0000-000000000001',
            userId: user.id,
            name: 'Demo Project',
            description: 'A sample project to demonstrate the Rialo Reactive Transaction Builder',
        },
    });

    console.log('Created demo project:', project.name);

    // Create demo workflow
    const workflow = await prisma.workflow.upsert({
        where: { id: '00000000-0000-0000-0000-000000000002' },
        update: {},
        create: {
            id: '00000000-0000-0000-0000-000000000002',
            projectId: project.id,
            name: 'Balance Monitor',
            description: 'Monitor account balance and transfer funds when threshold is reached',
            status: 'draft',
        },
    });

    console.log('Created demo workflow:', workflow.name);

    // Create demo nodes
    await prisma.workflowNode.upsert({
        where: {
            workflowId_nodeId: {
                workflowId: workflow.id,
                nodeId: 'trigger-1',
            },
        },
        update: {},
        create: {
            workflowId: workflow.id,
            nodeId: 'trigger-1',
            type: 'trigger',
            config: {
                triggerType: 'time_based',
                interval: 60,
            },
            position: { x: 100, y: 100 },
        },
    });

    await prisma.workflowNode.upsert({
        where: {
            workflowId_nodeId: {
                workflowId: workflow.id,
                nodeId: 'condition-1',
            },
        },
        update: {},
        create: {
            workflowId: workflow.id,
            nodeId: 'condition-1',
            type: 'condition',
            config: {
                leftOperand: 'account.balance',
                operator: '>',
                rightOperand: 1000,
            },
            position: { x: 300, y: 100 },
        },
    });

    await prisma.workflowNode.upsert({
        where: {
            workflowId_nodeId: {
                workflowId: workflow.id,
                nodeId: 'action-1',
            },
        },
        update: {},
        create: {
            workflowId: workflow.id,
            nodeId: 'action-1',
            type: 'action',
            config: {
                actionType: 'contract_call',
                contractAddress: '0x1234567890abcdef',
                functionName: 'transfer',
                parameters: [
                    { name: 'to', type: 'address', value: '0xabcdef1234567890' },
                    { name: 'amount', type: 'uint256', value: '500' },
                ],
            },
            position: { x: 500, y: 100 },
        },
    });

    console.log('Created demo nodes');

    // Create demo edges
    await prisma.workflowEdge.upsert({
        where: {
            workflowId_sourceNodeId_targetNodeId: {
                workflowId: workflow.id,
                sourceNodeId: 'trigger-1',
                targetNodeId: 'condition-1',
            },
        },
        update: {},
        create: {
            workflowId: workflow.id,
            sourceNodeId: 'trigger-1',
            targetNodeId: 'condition-1',
        },
    });

    await prisma.workflowEdge.upsert({
        where: {
            workflowId_sourceNodeId_targetNodeId: {
                workflowId: workflow.id,
                sourceNodeId: 'condition-1',
                targetNodeId: 'action-1',
            },
        },
        update: {},
        create: {
            workflowId: workflow.id,
            sourceNodeId: 'condition-1',
            targetNodeId: 'action-1',
        },
    });

    console.log('Created demo edges');
    console.log('Database seeding completed!');
}

main()
    .catch((e) => {
        console.error('Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
