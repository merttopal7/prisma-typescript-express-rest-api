import dotenv from 'dotenv'
dotenv.config()
import path from "path";
import fs from "fs";
import express from 'express'
import cookieParser from 'cookie-parser';
import { Express, Request, Response } from './utils/types'
import routes from './routes'
import bodyParser from "body-parser"
import errorHandler from './middlewares/errorHandler.middleware'
import swaggerUi from "swagger-ui-express";
import { generateSwaggerSchema } from './services/builder.service';
import swaggerDocument from "./utils/swagger.json";

const uploadsDir = path.join(__dirname, "/uploads");
if (!fs.existsSync(uploadsDir))
    fs.mkdirSync(uploadsDir, { recursive: true });

const swaggerDynamicRoutes = generateSwaggerSchema();
const app: Express = express()
app.use("/uploads", express.static(path.join(__dirname, "/uploads")));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup({ ...swaggerDocument, paths: { ...swaggerDocument.paths, ...swaggerDynamicRoutes } }));
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

const PORT = process.env.PORT || 8787
app.use(errorHandler);
app.use(cookieParser());


app.get('/', (req: Request, res: Response) => {
    return res.status(200).send(`
        <img src="http://localhost:8787/uploads/1754838289204-342423757.avif"/>
    `);
})

app.use(routes)

app.listen(PORT, () => console.log(`⭐: Server is running at ${PORT} ✔️`))