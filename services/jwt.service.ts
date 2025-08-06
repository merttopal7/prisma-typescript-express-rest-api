import jwt,{ SignOptions } from 'jsonwebtoken';
import type { StringValue } from "ms";


export const signJwt = (
    payload: object,
    secret: string,
    expiresIn: string
) => {
    return jwt.sign(payload, secret, { expiresIn: expiresIn as StringValue })
}

export const verifyJwt = (token: string, secret: string): null | jwt.JwtPayload => {
    try {
        return jwt.verify(token, secret) as jwt.JwtPayload;
    } catch {
        return null;
    }
};

