import { builder, query, buildValidation} from '../services/builder.service'
import prisma from '../loaders/prisma.loader'


export const User = builder<typeof prisma.user>(prisma.user)
export const Prisma = { prisma, query, buildValidation };
