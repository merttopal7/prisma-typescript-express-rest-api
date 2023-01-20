import { Express as exp, Request as req, Response as res,NextFunction } from 'express'

export type Response = res|any
export type Request = req
export type Express = exp
export type Next = NextFunction