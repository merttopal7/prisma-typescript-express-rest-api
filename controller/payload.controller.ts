import { Temir } from "../temir";
import { Prisma } from "../models/base.models";
import bcrypt from 'bcryptjs';
const { query, prisma } = Prisma;


export const transform: any = { user: {} }
transform.user.body = async (payload: any) => {
    const hashedPassword = await bcrypt.hash(payload.password, 10);
    payload.password = hashedPassword;
    console.log(payload)
    return payload;
}