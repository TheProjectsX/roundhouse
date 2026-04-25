import { Router } from "express";
import { validateRequest } from "@/middlewares/validate-request";
import { completion } from "@modules/models/models.service";
import { completionBodySchema } from "@modules/models/models.validation";

const modelsRouter = Router();

modelsRouter.post(
    "/completion",
    validateRequest({ body: completionBodySchema }),
    completion,
);

export { modelsRouter };