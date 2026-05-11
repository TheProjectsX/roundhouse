import { Prisma } from "@prisma/client";
import { IGenericErrorMessage } from "@/common/interfaces/error";
import { IGenericErrorResponse } from "@/common/interfaces/common";
// adjust the path if needed

export const handleValidationError = (
    error: Prisma.PrismaClientValidationError,
): IGenericErrorResponse => {
    const errors: IGenericErrorMessage[] = [
        {
            path: "",
            message: error.message,
        },
    ];

    return {
        statusCode: 400,
        message: "Validation Error",
        errorMessages: errors,
    };
};
