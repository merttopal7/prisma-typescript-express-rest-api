import { Request, Response } from 'express'
import { User } from '../models/base.models'
import { signJwt, verifyJwt } from '../services/jwt.service';
import bcrypt from 'bcryptjs';

export const login = (req: Request, res: Response) =>
    req.handle(async () => {
        const { email, password } = req.body;
        const userQuery = await User.query(User.prisma.findUnique({ where: { email } }));
        if (userQuery.error) return res.status(401).json({ error: userQuery.error, message: userQuery.errorMessage });
        const user = userQuery.data;
        if (!user) return res.status(401).json({ error: true, errorMessage: "Invalid Credentials!" });

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return res.status(401).json({ error: true, message: 'Invalid Credentials!' });

        const accessToken = signJwt({ userId: user.id }, process.env.JWT_SECRET_ACCESS!, process.env.JWT_ACCESS_EXPIRES_IN!);
        const refreshToken = signJwt({ userId: user.id }, process.env.JWT_SECRET_REFRESH!, process.env.JWT_REFRESH_EXPIRES_IN!);

        return res
            .cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000
            })
            .json({ error: false, accessToken, tokenType: "Bearer" });
    })


export const register = (req: Request, res: Response) =>
    req.handle(async () => {
        const data = User.validate(req.body);
        const { email, password, name } = data;

        const existingUser = await User.query(User.prisma.findUnique({ where: { email } }));
        if (!existingUser.error && existingUser.data) {
            return res.status(500).json({ error: true, errorMessage: 'Email is already taken.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const userQuery = await User.query(User.prisma.create({
            data: {
                email,
                password: hashedPassword,
                name
            },
        }));
        if (userQuery.error) return res.status(400).json(userQuery);
        const user = userQuery.data;
        if (!user) return res.status(400).json(userQuery);

        const accessToken = signJwt({ userId: user.id }, process.env.JWT_SECRET_ACCESS!, process.env.JWT_ACCESS_EXPIRES_IN!);
        const refreshToken = signJwt({ userId: user.id }, process.env.JWT_SECRET_REFRESH!, process.env.JWT_REFRESH_EXPIRES_IN!);

        return res
            .cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 gün
            })
            .json({ error: false, accessToken, tokenType: "Bearer" });
    })

export const refresh = (req: Request, res: Response) =>
    req.handle(async () => {
        const token = req.cookies?.refreshToken;
        if (!token) return res.status(401).json({ message: 'Not Found Refresh Token' });

        const payload = verifyJwt(token, process.env.JWT_SECRET_REFRESH!);
        if (!payload) return res.status(401).json({ message: 'Invalid Refresh Token' });

        const newAccessToken = signJwt({ userId: payload.userId }, process.env.JWT_SECRET_ACCESS!, process.env.JWT_ACCESS_EXPIRES_IN!);

        return res.json({ accessToken: newAccessToken });
    })

export const logout = (req: Request, res: Response) =>
    req.handle(() => {
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });
        return res.status(200).json({ message: 'Logout Successful' });
    })
