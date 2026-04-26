import { NextFunction, Request, Response } from "express";

export const errorHandler = (
    error: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction,
) => {
    if (error instanceof Error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }

    return res.status(500).json({
        success: false,
        message: "Something went wrong",
    });
};