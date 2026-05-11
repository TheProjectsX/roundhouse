export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPage: number;
}

export interface ApiResponse<T> {
    success: boolean;
    statusCode: number;
    message: string;
    data: T;
    pagination?: PaginationMeta;
}

export interface ApiResult<T> {
    data: T;
    pagination?: PaginationMeta;
    message: string;
}

export interface ApiErrorPayload {
    statusCode: number;
    message: string;
    errors?: Record<string, string[]>;
}
