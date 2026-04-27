import { Router } from "express";
import { modelsRouter } from "./models/models.routes";
import { openaiRouter } from "./openai/openai.routes";

const routes = Router();

const modules = [
    {
        path: "/",
        router: openaiRouter,
    },
    {
        path: "/chat",
        router: modelsRouter,
    },
];

modules.forEach((module) => {
    routes.use(module.path, module.router);
});

export default routes;
