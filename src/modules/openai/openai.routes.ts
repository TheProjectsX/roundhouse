import { Router } from "express";
import { chatCompletions, models, responses } from "./openai.service";

const openaiRouter = Router();

openaiRouter.post("/chat/completions", chatCompletions);
openaiRouter.post("/responses", responses);
openaiRouter.get("/models", models);

export { openaiRouter };
