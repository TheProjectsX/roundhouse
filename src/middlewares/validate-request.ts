import { NextFunction, Request, Response } from "express";
import { ZodError, ZodTypeAny } from "zod";

type RequestSchemas = {
    body?: ZodTypeAny;
    query?: ZodTypeAny;
    params?: ZodTypeAny;
};

export const validateRequest = (schemas: RequestSchemas) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            if (schemas.body) {
                req.body = schemas.body.parse(req.body);
            }

            if (schemas.query) {
                req.query = schemas.query.parse(req.query);
            }

            if (schemas.params) {
                req.params = schemas.params.parse(req.params);
            }

            next();
        } catch (error) {
            if (error instanceof ZodError) {
                return res.status(400).json({
                    success: false,
                    message: "Validation failed",
                    errors: error.issues.map((issue) => ({
                        path: issue.path.join("."),
                        message: issue.message,
                    })),
                });
            }

            next(error);
        }
    };
};