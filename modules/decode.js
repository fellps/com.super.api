import Result from './result'

const decode = (req, res, next) => {
  try {
    req.body = JSON.parse(req.body.data)
    next()
  } catch (error) {
    return Result.Error.ErrorOnRequest(res)  
  }
}

export default decode