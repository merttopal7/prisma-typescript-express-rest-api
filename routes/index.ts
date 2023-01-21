import { Router } from "express";
import { all as getUsers, single as getUser, create as createUser, del as deleteUser } from "../controller/user.controller";

const routes = Router()
for(let i = 0;i<10;i++) {
    routes.get(`/count/${i}`,getUsers)
}
routes.get('/user',getUsers)
routes.get('/user/:id',getUser)
routes.post('/user',createUser)
routes.delete('/user/:id',deleteUser)

export default routes