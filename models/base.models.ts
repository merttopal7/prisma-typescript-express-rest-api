import builder from '../services/builder.service'
import prisma from '../loaders/prisma.loader'

export const User = builder(prisma.user,{
    id:"number",
    name:"string",
    email:"string"
})
export const Post = builder(prisma.post)