import { Router } from "express";
import { all as getPosts, single as getPost, create as createPost } from "../contoller/post.controller";
const routes = Router()


routes.get('/post',getPosts)
routes.get('/post/:id',getPost)
routes.post('/post',createPost)

export default routes