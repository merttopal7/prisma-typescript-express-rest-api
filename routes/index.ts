import { Router } from "express";
import { login, logout, refresh, register } from "../controller/auth.controller";
import { all as getUsers, single as getUser, create as createUser, del as deleteUser } from "../controller/user.controller";
import { authenticate } from "../middlewares/auth.middleware";

const routes = Router()
routes.post('/register', register)
routes.post('/login', login)
routes.post('/refresh', refresh)
routes.post('/logout', logout)


routes.use(authenticate)
routes.get('/users', getUsers)
routes.get('/users/:id', getUser)
routes.post('/users', createUser)
routes.delete('/users/:id', deleteUser)


export default routes