import dotenv from 'dotenv'
dotenv.config()
import express from 'express'
import { Express, Request, Response, Next } from './utils/types'
import routes from './routes'
import bodyParser from "body-parser"
import errorHandler from './middlewares/errorHandler.middleware'

const app: Express = express()
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

const PORT = process.env.PORT || 8787
app.use(errorHandler)


app.get('/', async (req: Request, res: Response) => res.handle(
    () => {
        return res.status(200).json({message:`Application Working...`})
    }
))

app.use(routes)

app.listen(PORT, () => console.log(`⭐: Server is running at ${PORT} ✔️`))