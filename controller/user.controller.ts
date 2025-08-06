import { Request, Response } from 'express'
import { Prisma, User } from '../models/base.models'

// console.log(await Prisma.query(Prisma.prisma.$queryRaw`SELECT * FROM User`))

export const all = (req: Request, res: Response) =>
    req.handle(async () => {
        const users = await User.query(User.prisma.findMany());
        return res.json({
            message: users?.error ? `Users fetch error !` : `Users fetched !`,
            ...users
        })
    })

export const single = (req: Request, res: Response) =>
    req.handle(async () => {
        const { id } = req.params
        const user = await User.query(User.prisma.findUnique({
            where: {
                id: parseInt(id)
            }
        }))
        return res.json({
            message: user?.error ? `User fetch error !` : `User fetched !`,
            ...user
        })
    })

export const create = (req: Request, res: Response) =>
    req.handle(async () => {
        const data = User.validate(req.body)
        const user = await User.query(User.prisma.create({
            data
        }))
        return res.json({
            message: user?.error ? `User create error !` : `User created !`,
            ...user
        })
    })

export const del = (req: Request, res: Response) =>
    req.handle(async () => {
        const { id } = req.params
        const user = await User.query(User.prisma.delete({
            where: {
                id: parseInt(id)
            }
        }))
        return res.json({
            message: user?.error ? `User create error !` : `User created !`,
            ...user
        })
    })
