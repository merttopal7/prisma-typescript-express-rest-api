import dotenv from 'dotenv'
dotenv.config()
import path from "path";
import fs from "fs";
import express, { RequestHandler } from 'express'
import cookieParser from 'cookie-parser';
import { Express, Request, Response } from '../utils/types'
import routes from '../routes/temir.routes'
import bodyParser from "body-parser"
import errorHandler from '../middlewares/errorHandler.middleware'
import swaggerUi from "swagger-ui-express";
import { generateSwaggerSchema } from '../services/builder.service';
import swaggerDocument from "../utils/swagger.json";
import QueryString from 'qs';
import * as Models from "../models/base.models";

interface ParamsDictionary {
    [key: string]: string;
}
type ExpressMethod = "get" | "post" | "put" | "delete" | "patch";


export class Temir {
    static app: Express = express()
    static PORT: number = parseInt(process.env.PORT || "8787")
    static uploadFolder: string = "/uploads"
    static endpoints: any = { public: { get: [], post: [], put: [], patch: [], search: [], options: [], delete: [] }, protected: { get: [], post: [], put: [], patch: [], search: [], options: [], delete: [] } };


    static listen(PORT?: number, listenCallback?: (() => void) | undefined) {
        Temir.createUploadFolder();
        Temir.middlewares();
        Temir.app.listen(PORT ?? Temir.PORT, listenCallback ?? (() => console.log(`⭐: Server is running at ${PORT ?? Temir.PORT} ✔️`)))
    }

    static middlewares() {
        const swaggerDoc = Temir.swaggerDoc()
        Temir.app.use(bodyParser.json())
        Temir.app.use(bodyParser.urlencoded({ extended: true }))
        Temir.app.use(errorHandler);
        Temir.app.use(cookieParser());
        Temir.app.use("/uploads", express.static(path.join(__dirname, `..${Temir.uploadFolder}`)));
        Temir.app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDoc));
        Object.entries(Temir.endpoints.public).forEach(([method, endpoints]: [string, any]) => endpoints.forEach((endpoint: any) => Temir.app[method as ExpressMethod](endpoint.url, ...endpoint.handlers)));
        Temir.app.use(routes);
        Object.entries(Temir.endpoints.protected).forEach(([method, endpoints]: [string, any]) => endpoints.forEach((endpoint: any) => Temir.app[method as ExpressMethod](endpoint.url, ...endpoint.handlers)));
    }
    static use(...args: any) {
        Temir.app.use(...args);
    }
    static router() {
        const createExpressFunctions = (_protected: string) => ({
            get: this.get(_protected),
            post: this.post(_protected),
            put: this.put(_protected),
            patch: this.patch(_protected),
            delete: this.delete(_protected),
            search: this.search(_protected),
            options: this.options(_protected)
        })
        return {
            public: createExpressFunctions("public"),
            protected: createExpressFunctions("protected"),
        }
    }
    private static get(_protected: string = "public") {
        return (url: string, ...handlers: RequestHandler<ParamsDictionary, any, any, QueryString.ParsedQs, Record<string, any>>[]) => {
            (_protected === "public" ? Temir.endpoints.public : Temir.endpoints.protected).get.push({
                url, handlers: handlers.map((handler: Function) => ((req: Request, res: Response) =>
                    req.handle(async () => await handler(req, res))))
            })
        }
    }
    private static post(_protected: string = "public") {
        return (url: string, ...handlers: RequestHandler<ParamsDictionary, any, any, QueryString.ParsedQs, Record<string, any>>[]) => {
            (_protected === "public" ? Temir.endpoints.public : Temir.endpoints.protected).post.push({
                url, handlers: handlers.map((handler: Function) => ((req: Request, res: Response) =>
                    req.handle(async () => await handler(req, res))))
            })
        }
    }
    private static put(_protected: string = "public") {
        return (url: string, ...handlers: RequestHandler<ParamsDictionary, any, any, QueryString.ParsedQs, Record<string, any>>[]) => {
            (_protected === "public" ? Temir.endpoints.public : Temir.endpoints.protected).put.push({
                url, handlers: handlers.map((handler: Function) => ((req: Request, res: Response) =>
                    req.handle(async () => await handler(req, res))))
            })
        }
    }
    private static patch(_protected: string = "public") {
        return (url: string, ...handlers: RequestHandler<ParamsDictionary, any, any, QueryString.ParsedQs, Record<string, any>>[]) => {
            (_protected === "public" ? Temir.endpoints.public : Temir.endpoints.protected).patch.push({
                url, handlers: handlers.map((handler: Function) => ((req: Request, res: Response) =>
                    req.handle(async () => await handler(req, res))))
            })
        }
    }
    private static delete(_protected: string = "public") {
        return (url: string, ...handlers: RequestHandler<ParamsDictionary, any, any, QueryString.ParsedQs, Record<string, any>>[]) => {
            (_protected === "public" ? Temir.endpoints.public : Temir.endpoints.protected).delete.push({
                url, handlers: handlers.map((handler: Function) => ((req: Request, res: Response) =>
                    req.handle(async () => await handler(req, res))))
            })
        }
    }
    private static search(_protected: string = "public") {
        return (url: string, ...handlers: RequestHandler<ParamsDictionary, any, any, QueryString.ParsedQs, Record<string, any>>[]) => {
            (_protected === "public" ? Temir.endpoints.public : Temir.endpoints.protected).search.push({
                url, handlers: handlers.map((handler: Function) => ((req: Request, res: Response) =>
                    req.handle(async () => await handler(req, res))))
            })
        }
    }
    private static options(_protected: string = "public") {
        return (url: string, ...handlers: RequestHandler<ParamsDictionary, any, any, QueryString.ParsedQs, Record<string, any>>[]) => {
            (_protected === "public" ? Temir.endpoints.public : Temir.endpoints.protected).options.push({
                url, handlers: handlers.map((handler: Function) => ((req: Request, res: Response) =>
                    req.handle(async () => await handler(req, res))))
            })
        }
    }
    static swaggerDoc() {
        const swaggerDynamicRoutes = generateSwaggerSchema();
        return { ...swaggerDocument, paths: { ...swaggerDocument.paths, ...swaggerDynamicRoutes } };
    }

    static createUploadFolder() {
        const uploadsDir = path.join(__dirname, `..${Temir.uploadFolder}`);
        if (!fs.existsSync(uploadsDir))
            fs.mkdirSync(uploadsDir, { recursive: true });
    }

    static database() {
        return {
            ...Models,
            prisma: Models.Prisma.prisma,
            validator: Models.Prisma.buildValidation,
            queryWrapper: Models.Prisma.query,
        };
    }
}