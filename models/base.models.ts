import { builder, query } from '../services/builder.service'
import prisma from '../loaders/prisma.loader'

export const User = builder<typeof prisma.user>(prisma.user)
export const Post = builder<typeof prisma.post>(prisma.post)
export const Prisma = { prisma, query };
