import { Request } from 'express';

declare global {
    namespace Express {
        interface Request {
            handle: Function;
            user?: {
                userId: number;
            };
        }
    }
}
