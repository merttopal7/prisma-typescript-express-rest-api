import { Router } from "express";
import { login, logout, refresh, register } from "../temir/auth.controller";
import { findById, find, post, put, models, createData } from "../temir/dynamic.controller";
import { all as getUsers, single as getUser, create as createUser, del as deleteUser } from "../temir/user.controller";
import { uploadFile } from "../temir/uploads.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { upload } from "../middlewares/uploads.middleware";

const routes = Router()
routes.get("/mock", createData)
routes.post('/auth/register', register)
routes.post('/auth/login', login)
routes.post('/auth/refresh', refresh)
routes.post('/auth/logout', logout)

routes.use(authenticate)
routes.post("/uploads", upload.single("file"), uploadFile);
routes.get("/items", models);
routes.get("/items/:model", find);
routes.post("/items/:model/get", find);
routes.get("/items/:model/:id", findById);
routes.post("/items/:model", post);
routes.put("/items/:model/:id", put);

routes.get('/users', getUsers)
routes.get('/users/:id', getUser)
routes.post('/users', createUser)
routes.delete('/users/:id', deleteUser)

export default routes