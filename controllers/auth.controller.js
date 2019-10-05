import User from '../models/user.model'
import Result from '../modules/result'
import Jwt from 'jsonwebtoken'
import Crypto from 'crypto'
import _ from 'lodash'

export default {
  // Login
  login: async (req, res) => {
    if(_.isEmpty(req.body)) {
      return Result.Error.RequiredBody(res)
    }

    const hash = Crypto.createHmac('sha256', process.env.PASSWORD_SECRET)
      .update(req.body.password)
      .digest('hex')

    User.findOne({
      cpf: req.body.cpf,
      password: hash
    })
      .then(user => {
        if(_.isEmpty(user)) {
          return Result.NotFound.ErrorOnLogin(res)           
        }
        const { id } = user
        const result = {
          _id: id,
          auth: true,
          name: user.name,
          token: Jwt.sign({ id }, process.env.JWT_SECRET, {
            expiresIn: 60 * 60 * 12 // expires in 12h
          })
        }

        return Result.Success.SuccessOnLogin(res, result)
      }).catch(() => {
        return Result.Error.ErrorOnLogin(res)
      })
  },

  // Logout
  logout: async (req, res) => {
    Result.Success.SuccessOnLogout(res, { auth: false, token: null })
  }
}