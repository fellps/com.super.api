import Jwt from 'jsonwebtoken'
import Result from './result'
import User from '../models/user.model'
import mongoose from 'mongoose'
import _ from 'lodash'

const verifyJWT = (req, res, next) => {
  var token = req.headers['x-access-token']
  if (!token)
    return Result.Unauthorized.RequiredLogin(res)
    
  Jwt.verify(token, process.env.JWT_SECRET, function(err, decoded) {
    if (err) 
      return Result.NotFound.ErrorOnLogin(res)  

    // se tudo estiver ok, salva no request para uso posterior

    req.userId = mongoose.Types.ObjectId(decoded.id)
    next()
  })
}

export const verifyAdminJWT = (req, res, next) => {
  var token = req.headers['x-access-token']
  if (!token)
    return Result.Unauthorized.RequiredLogin(res)
    
  Jwt.verify(token, process.env.JWT_SECRET, function(err, decoded) {
    if (err)
      return Result.NotFound.ErrorPermission(res)  

    User.findById(decoded.id)
      .then(user => {
        if(!user) {
          return Result.Unauthorized.ErrorPermission(res)
        }
        
        const isAdmin = _.some(user.roles, (role) => {
          return role === 'ADMIN'
        })

        if (!isAdmin)
          return Result.Unauthorized.ErrorPermission(res)

        req.userId = mongoose.Types.ObjectId(decoded.id)
        next()
      }).catch(() => {
        return Result.Unauthorized.RequiredLogin(res)
      })
  })
}

export default verifyJWT