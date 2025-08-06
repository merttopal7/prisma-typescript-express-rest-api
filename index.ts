import dotenv from 'dotenv'
dotenv.config()
import express from 'express'
import cookieParser from 'cookie-parser';
import { Express, Request, Response } from './utils/types'
import routes from './routes'
import bodyParser from "body-parser"
import errorHandler from './middlewares/errorHandler.middleware'

const app: Express = express()
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

const PORT = process.env.PORT || 8787
app.use(errorHandler);
app.use(cookieParser());


app.get('/', (req: Request, res: Response) => {
    return res.status(200).json({
        e: 1
    });
})

app.use(routes)

app.listen(PORT, () => console.log(`⭐: Server is running at ${PORT} ✔️`))