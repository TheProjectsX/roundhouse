import { Router } from "express";
import { modelsRouter } from "./models/models.routes";

const routes = Router();

const modules = [
    {
        path: "/chat",
        router: modelsRouter,
    },
];

modules.forEach((module) => {
    routes.use(module.path, module.router);
});

export default routes;
