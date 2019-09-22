import User from '../models/user.model'
import Result from '../modules/result'
import Crypto from 'crypto'
import _ from 'lodash'

export default {
  // Create user
  create: async (req, res) => {
    if(_.isEmpty(req.body)) {
      return Result.Error.RequiredBody(res)
    }

    const hash = Crypto.createHmac('sha256', process.env.PASSWORD_SECRET)
      .update(req.body.password)
      .digest('hex')

    const user = new User({
      name: req.body.name,
      cpf: req.body.cpf,
      birthdate: req.body.birthdate,
      email: req.body.email,
      phone: req.body.phone,
      password: hash,
      roles: ['USER']
    })

    user.save()
      .then(() => {
        return Result.Success.SuccessOnSave(res)
      }).catch(() => {
        return Result.Error.ErrorOnSave(res)
      })
  },

  // Find all users
  findAll: async (req, res) => {
    User.find()
      .then(users => {
        return Result.Success.SuccessOnSearch(res, users)
      }).catch(() => {
        return Result.Success.NoRecordsFound(res)
      })
  },

  // Find one user
  findOne: async (req, res) => {
    User.findById(req.params.userId)
      .then(user => {
        if(!user) {
          return Result.NotFound.NoRecordsFound(res)           
        }
        return Result.Success.SuccessOnSearch(res, user)
      }).catch(err => {
        if(err.kind === 'ObjectId') {
          return Result.NotFound.NoRecordsFound(res)
        }
        return Result.Error.ErrorOnSearch(res)
      })
  },

  // Update user
  update: async (req, res) => {
    if(!req.body) {
      return Result.Error.RequiredBody(res)
    }

    const hash = Crypto.createHmac('sha256', process.env.PASSWORD_SECRET)
      .update(req.body.password)
      .digest('hex')

    User.findByIdAndUpdate(req.params.userId, {
      name: req.body.name,
      cpf: req.body.cpf,
      birthdate: req.body.birthdate,
      email: req.body.email,
      phone: req.body.phone,
      password: hash
    }, { new: true })
      .then(user => {
        if(!user) {
          return Result.NotFound.NoRecordsFound(res)
        }
        return Result.Success.SuccessOnUpdate(res)
      }).catch(err => {
        if(err.kind === 'ObjectId') {
          return Result.NotFound.NoRecordsFound(res)           
        }
        return Result.InternalError.ErrorOnOperation(res)
      })
  },

  // Delete user
  delete: async (req, res) => {
    User.findByIdAndRemove(req.params.userId)
      .then(user => {
        if(!user) {
          return Result.NotFound.NoRecordsFound(res)
        }
        return Result.Success.SuccessOnRemove(res)
      }).catch(err => {
        if(err.kind === 'ObjectId' || err.name === 'NotFound') {
          return Result.NotFound.NoRecordsFound(res)                         
        }
        return Result.InternalError.ErrorOnOperation(res)
      })
  }
}