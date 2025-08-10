import { Request, Response } from 'express'
import { Prisma } from '../models/base.models'
import multer from "multer";
import path from "path";
const { prisma, query } = Prisma;


const storage = multer.diskStorage({
    destination: (req: any, file: any, cb: any) => {
        cb(null, path.join(__dirname, "../uploads"));
    },
    filename: (req: any, file: any, cb: any) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

export const upload = multer({ storage });


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