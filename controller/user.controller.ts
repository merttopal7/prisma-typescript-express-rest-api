import { Request, Response } from '../utils/types'
import { User } from '../models/base.models'

export const all = (req:Request,res:Response) => 
res.handle(async () => {
    const users = await User.findMany()
    console.log(User.validate({id:"1",name:"Mert",email:"mert@prisma.io",s:1}));
    return res.json({
        message:users?.error ? `Users fetch error !` : `Users fetched !`,
        ...users
    })
})

export const single = (req:Request,res:Response) => 
res.handle(async () => {
    const { id } = req.params
    const user = await User.find({
        where:{
            id: parseInt(id)
        }
    })
    return res.json({
        message:user?.error ? `User fetch error !` : `User fetched !`,
        ...user
    })
})

export const create = (req:Request,res:Response) => 
res.handle(async () => {
    const data = User.validate(req.body)
    const user = await User.create({
        data
    })
    return res.json({
        message:user?.error ? `User create error !` : `User created !`,
        ...user
    })
})

export const del = (req:Request,res:Response) => 
res.handle(async () => {
    const { id } = req.params
    const user = await User.delete({
        where:{
            id:parseInt(id)
        }
    })
    return res.json({
        message:user?.error ? `User create error !` : `User created !`,
        ...user
    })
})
