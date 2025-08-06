import { Response, Next } from '../utils/types'

export default (req: any, res: Response, next: Next) => {
  req.handle = async (func: Function) => {
    try {
      const response = await func()
      if (!response) {
        return res.status(400).json({
          message: `An error occured!`,
          error: true,
          errorMessage: `No Response!`
        })
      }
    } catch (error: any) {
      return res.status(error.status || 400).json({
        message: `An error occured!`,
        error: true,
        errorMessage: error.message
      })
    }
  }
  return next()
}