export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: ApiError;
    metadata?: ApiMetadata;
}

export interface ApiError {
    code: string;
    message: string;
    details?: unknown;
}

export interface ApiMetadata {
    timestamp: string;
    requestId?: string;
    pagination?: PaginationMetadata;
}

export interface PaginationMetadata {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface LoginResponse {
    accessToken: string;
    refreshToken: string;
    user: {
        id: string;
        email: string;
    };
}

export interface RefreshResponse {
    accessToken: string;
    refreshToken: string;
}

export interface PaginationParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    order?: 'asc' | 'desc';
}
