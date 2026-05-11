import { Prisma } from "@prisma/client";
import { IGenericErrorMessage } from "@/common/interfaces/error";
import { IGenericErrorResponse } from "@/common/interfaces/common";
// adjust path if needed

export const handleClientError = (
    error: Prisma.PrismaClientKnownRequestError,
): IGenericErrorResponse => {
    let errors: IGenericErrorMessage[] = [];
    let message = "";
    const statusCode = 400;

    if (error.code === "P2025") {
        message = (error.meta?.cause as string) || "Record not found!";
        errors = [
            {
                path: "",
                message,
            },
        ];
    } else if (error.code === "P2003") {
        if (error.message.includes("delete()` invocation:")) {
            message =
                "Delete operation failed. Record not found or related records exist.";
            errors = [
                {
                    path: "",
                    message,
                },
            ];
        }
    } else {
        message = error.message || "Prisma client known request error";
        errors = [
            {
                path: "",
                message,
            },
        ];
    }

    return {
        statusCode,
        message,
        errorMessages: errors,
    };
};
