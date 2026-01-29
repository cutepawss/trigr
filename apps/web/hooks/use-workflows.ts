import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { workflowSchemas, Workflow, ValidationResult, GasEstimate } from '@rialo-builder/shared';

export function useWorkflows(projectId: string) {
    return useQuery({
        queryKey: ['workflows', projectId],
        queryFn: async () => {
            const response = await apiClient.get(`/projects/${projectId}/workflows`);
            return response.data.data as Workflow[];
        },
        enabled: !!projectId,
    });
}

export function useWorkflow(id: string) {
    return useQuery({
        queryKey: ['workflows', id],
        queryFn: async () => {
            const response = await apiClient.get(`/workflows/${id}`);
            return response.data.data as Workflow;
        },
        enabled: !!id,
    });
}

export function useValidateWorkflow(id: string) {
    return useMutation({
        mutationFn: async () => {
            const response = await apiClient.post(`/workflows/${id}/validate`);
            return response.data.data as ValidationResult;
        },
    });
}

export function useEstimateGas(id: string) {
    return useMutation({
        mutationFn: async () => {
            const response = await apiClient.post(`/workflows/${id}/estimate-gas`);
            return response.data.data as GasEstimate;
        },
    });
}

export function useGenerateCode(id: string) {
    return useMutation({
        mutationFn: async () => {
            const response = await apiClient.post(`/workflows/${id}/generate-code`);
            return response.data.data as { code: string; language: string };
        },
    });
}

export function useSimulateWorkflow(id: string) {
    return useMutation({
        mutationFn: async (initialState: Record<string, unknown>) => {
            const response = await apiClient.post(`/workflows/${id}/simulate`, { initialState });
            return response.data.data;
        },
    });
}

export function useDeployWorkflow(id: string) {
    return useMutation({
        mutationFn: async () => {
            const response = await apiClient.post(`/workflows/${id}/deploy`);
            return response.data.data;
        },
    });
}

export function useCreateWorkflow(projectId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { name: string; description?: string }) => {
            const response = await apiClient.post(`/workflows/projects/${projectId}/workflows`, {
                name: data.name,
                description: data.description,
            });
            return response.data.data as Workflow;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workflows', projectId] });
        },
    });
}
