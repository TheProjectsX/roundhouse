import { Injectable } from "@nestjs/common";

export interface ResponseParams<T> {
    success?: boolean;
    statusCode: number;
    message: string;
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPage: number;
    };
    data?: T | null | undefined;
}

@Injectable()
export class ResponseService {
    static formatResponse<T>(jsonData: ResponseParams<T>) {
        return {
            success:
                jsonData.success ??
                (jsonData.statusCode >= 200 && jsonData.statusCode < 300),
            statusCode: jsonData.statusCode,
            message: jsonData.message,
            pagination: jsonData.pagination || null || undefined,
            data: jsonData.data || null || undefined,
        };
    }
}
