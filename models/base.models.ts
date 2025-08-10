import { builder, query } from '../services/builder.service'
import prisma from '../loaders/prisma.loader'


export const User = builder<typeof prisma.user>(prisma.user)
export const Role = builder<typeof prisma.role>(prisma.role)
export const Prisma = { prisma, query };
