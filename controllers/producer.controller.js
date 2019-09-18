import Producer from '../models/producer.model'
import Result from '../modules/result'
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
      phone: req.body.phone
    })

    producer.save()
      .then(producer => {
        return Result.Success.SuccessOnSave(res, producer)
      }).catch(() => {
        return Result.Error.ErrorOnSave(res)
      })
  },

  // Find all producers
  findAll: async (req, res) => {
    Producer.find()
      .then(producers => {
        return Result.Success.SuccessOnSearch(res, producers)
      }).catch(() => {
        return Result.Success.NoRecordsFound(res)
      })
  },

  // Find one producer
  findOne: async (req, res) => {
    Producer.findById(req.params.producerId)
      .then(producer => {
        if(!producer) {
          return Result.NotFound.NoRecordsFound(res)           
        }
        return Result.Success.SuccessOnSearch(res, producer)
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

    Producer.findByIdAndUpdate(req.params.producerId, {
      socialReason: req.body.socialReason,
      cnpj: req.body.cnpj,
      cep: req.body.cep,
      state: req.body.state,
      city: req.body.city,
      address: req.body.address,
      addressNumber: req.body.addressNumber,
      email: req.body.email,
      phone: req.body.phone
    }, { new: true })
      .then(producer => {
        if(!producer) {
          return Result.NotFound.NoRecordsFound(res)
        }
        return Result.Success.SuccessOnUpdate(res, producer)
      }).catch(err => {
        if(err.kind === 'ObjectId') {
          return Result.NotFound.NoRecordsFound(res)           
        }
        console.log(err)
        return Result.InternalError.ErrorOnOperation(res)
      })
  },

  // Delete producer
  delete: async (req, res) => {
    Producer.findByIdAndRemove(req.params.producerId)
      .then(producer => {
        if(!producer) {
          return Result.NotFound.NoRecordsFound(res)
        }
        return Result.Success.SuccessOnRemove(res, producer)
      }).catch(err => {
        if(err.kind === 'ObjectId' || err.name === 'NotFound') {
          return Result.NotFound.NoRecordsFound(res)                         
        }
        return Result.InternalError.ErrorOnOperation(res)
      })
  }
}