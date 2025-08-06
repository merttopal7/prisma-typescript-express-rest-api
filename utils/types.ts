import { Express as ExpressExpress, Request as ExpressRequest, Response as ExpressResponse, NextFunction } from 'express';

export type Request = ExpressRequest;
export type Response = ExpressResponse;
export type Express = ExpressExpress;
export type Next = NextFunction;