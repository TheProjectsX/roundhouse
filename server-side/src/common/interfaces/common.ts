/* eslint-disable @typescript-eslint/no-namespace */

import { IGenericErrorMessage } from "@/common/interfaces/error";
import { UserPayload } from "../guards/auth.guard";

export type IGenericResponse<T> = {
    meta: {
        page: number;
        limit: number;
        total: number;
    };
    data: T;
};

export type IGenericErrorResponse = {
    statusCode: number;
    message: string;
    errorMessages: IGenericErrorMessage[];
};

declare global {
    namespace Express {
        interface Request {
            user?: UserPayload | undefined;
        }
    }
}
