import Jwt from 'jsonwebtoken'
import Result from './result'

export default function verifyJWT(req, res, next) {
  var token = req.headers['x-access-token']
  if (!token)
    return Result.Unauthorized.RequiredLogin(res)
    
  Jwt.verify(token, process.env.JWT_SECRET, function(err, decoded) {
    if (err) 
      return Result.NotFound.ErrorOnLogin(res)  

    // se tudo estiver ok, salva no request para uso posterior
    req.userId = decoded.id
    next()
  })
}