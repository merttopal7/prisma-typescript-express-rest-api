import { Request, Response, Next } from '../utils/types'

export const errorHandlerBegin = (req:Request,res:Response,next:Next) => {
    res.handle = async (func:Function) => {
      try {
        const response = await func()
        if(!response) return res.status(200).json({
            message:`An error occured !`,
            error:true,
            errorMessage:`No Response !`
        })
      } catch(error:any) {
        return next(error)
      }
    };
    next()
}

export const errorHandlerEnd = (error:any, req:Request, res:Response) => {
    console.log( `[ResponseError]: ${error.message}`)
    const status = error.status || 400
    return res.status(status).json({
        message:`An error occured !`,
        error:true,
        errorMessage:error.message
    })
}
