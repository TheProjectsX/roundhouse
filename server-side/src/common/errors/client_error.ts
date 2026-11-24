import { Prisma } from "@prisma/client";
import { IGenericErrorMessage } from "@/common/interfaces/error";
import { IGenericErrorResponse } from "@/common/interfaces/common";
// adjust path if needed

export const handleClientError = (
    error: Prisma.PrismaClientKnownRequestError,
): IGenericErrorResponse => {
    let errors: IGenericErrorMessage[] = [];
    let message = "";
    let statusCode = 400;

    if (error.code === "P2025") {
        statusCode = 404;
        message = (error.meta?.cause as string) || "Record not found!";
        errors = [
            {
                path: "",
                message,
            },
        ];
    } else if (error.code === "P2002") {
        statusCode = 409;
        const target = Array.isArray(error.meta?.target)
            ? error.meta.target.join(", ")
            : (error.meta?.target as string | undefined);
        message = target
            ? `Duplicate value for ${target}.`
            : "A record with this unique value already exists.";
        errors = [
            {
                path: target || "",
                message,
            },
        ];
    } else if (error.code === "P2003") {
        message = error.message.includes("delete()` invocation:")
            ? "Delete operation failed. Record not found or related records exist."
            : "Operation failed. Related record not found or constraint failed.";
        errors = [
            {
                path: "",
                message,
            },
        ];
    } else if (error.code === "P2014") {
        statusCode = 409;
        message =
            "Operation failed because a required relation with existing records would be violated.";
        errors = [
            {
                path: "",
                message,
            },
        ];
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
