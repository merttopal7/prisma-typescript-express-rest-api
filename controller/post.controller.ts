import { Request, Response } from '../utils/types'
import { User } from '../models/base.models'

export const all = (req:Request,res:Response) => 
res.handle(async () => {
    const users = await User.findMany()
    return res.json({
        message:users?.error ? `Users fetch error !` : `Users fetched !`,
        ...users
    });
})

export const single = (req:Request,res:Response) => 
res.handle(async () => {
    const { id } = req.params
    const user = await User.find({
        where:{
            id: parseInt(id)
        }
    });
    return res.json({
        message:user?.error ? `User fetch error !` : `User fetched !`,
        ...user
    });
})

export const create = (req:Request,res:Response) => 
res.handle(async () => {
    const { email, name } = req.body
    const user = await User.create({
        data:{
            email,
            name
        }
    });
    return res.json({
        message:user?.error ? `User create error !` : `User created !`,
        ...user
    });
})
