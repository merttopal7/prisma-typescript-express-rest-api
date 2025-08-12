import { Request, Response } from 'express'
import { Prisma } from '../models/base.models'
const { prisma, query } = Prisma;

export const uploadFile = (req: Request, res: Response) => {
    return req.handle(async () => {
        if (!req.file)
            return res.status(400).json({ error: true, errorMessage: "File not found!" });

        const ownerId = Number(req.user?.userId);

        const newUpload = await query(prisma.upload.create({
            data: {
                filename: req.file.filename,
                mimetype: req.file.mimetype,
                path: `/uploads/${req.file.filename}`,
                ownerId
            }
        }));

        return res.json({ ...newUpload });
    })
}