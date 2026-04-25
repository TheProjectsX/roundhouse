import express from "express";
import cors from "cors";
import { errorHandler } from "@/middlewares/error-handler";
import routes from "./modules";

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
    res.json({ success: true, message: "Roundhouse API is running!" });
});

app.use("/v1", routes);

app.use(errorHandler);

app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
});
