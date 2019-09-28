import Producer from '../models/producer.model'
import Result from '../modules/result'
import Filter from '../modules/filterCreator'
import _ from 'lodash'

export default {
  // Create producer
  create: async (req, res) => {
    if(_.isEmpty(req.body)) {
      return Result.Error.RequiredBody(res)
    }

    const producer = new Producer({
      socialReason: req.body.socialReason,
      cnpj: req.body.cnpj,
      cep: req.body.cep,
      state: req.body.state,
      city: req.body.city,
      address: req.body.address,
      addressNumber: req.body.addressNumber,
      email: req.body.email,
      phone: req.body.phone,
      userId: req.userId,
      isEnabled: true
    })

    producer.save()
      .then(() => {
        return Result.Success.SuccessOnSave(res)
      }).catch(() => {
        return Result.Error.ErrorOnSave(res)
      })
  },

  // Find all producers
  findAll: async (req, res) => {
    Producer.find(Filter(req, {}))
      //.select('socialReason cnpj')
      .then(producers => {
        return Result.Success.SuccessOnSearch(res, producers)
      }).catch(() => {
        return Result.Success.NoRecordsFound(res)
      })
  },

  // Find one producer
  findOne: async (req, res) => {
    Producer.find(Filter(req, {
      _id: req.params.producerId,
      userId: req.userId
    }))
      .then(producer => {
        if(!producer) {
          return Result.NotFound.NoRecordsFound(res)           
        }
        return Result.Success.SuccessOnSearch(res, producer.shift())
      }).catch(err => {
        if(err.kind === 'ObjectId') {
          return Result.NotFound.NoRecordsFound(res)
        }
        return Result.Error.ErrorOnSearch(res)
      })
  },

  // Update producer
  update: async (req, res) => {
    if(!req.body) {
      return Result.Error.RequiredBody(res)
    }

    Producer.findOneAndUpdate({
      _id: req.params.producerId,
      userId: req.userId
    }, {
      socialReason: req.body.socialReason,
      cnpj: req.body.cnpj,
      cep: req.body.cep,
      state: req.body.state,
      city: req.body.city,
      address: req.body.address,
      addressNumber: req.body.addressNumber,
      email: req.body.email,
      phone: req.body.phone,
      userId: req.userId
    }, { new: true })
      .then(producer => {
        if(!producer) {
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

  // Delete producer
  delete: async (req, res) => {
    Producer.findOneAndRemove({
      _id: req.params.producerId,
      userId: req.userId
    })
      .then(producer => {
        if(!producer) {
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