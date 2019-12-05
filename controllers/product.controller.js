import Producer from '../models/producer.model'
import Result from '../modules/result'
import Filter from '../modules/filterCreator'
import _ from 'lodash'

export default {
  // Create product
  create: async (req, res) => {
    if(_.isEmpty(req.body)) {
      return Result.Error.RequiredBody(res)
    }

    Producer.updateOne({
      'events._id': req.params.eventId,
      //'userId': req.userId
    },
    {
      $push: {
        'events.$.products': req.body
      }
    },
    (err) => {
      if (err) 
        return Result.Error.ErrorOnSave(res)
      return Result.Success.SuccessOnSave(res)
    })
  },

  // Find all products
  findAll: async (req, res) => {
    Producer.findOne(Filter(req, {
      'events._id': req.params.eventId,
      //'userId': req.userId
    }), 'events.$')
      .then(producer => {
        if(!producer) {
          return Result.NotFound.NoRecordsFound(res)
        }
        const event = producer.events.id(req.params.eventId)
        return Result.Success.SuccessOnSearch(res, event.products)
      }).catch(err => {
        if(err.kind === 'ObjectId') {
          return Result.NotFound.NoRecordsFound(res)
        }
        return Result.Error.ErrorOnSearch(res)
      })
  },

  // Find one product
  findOne: async (req, res) => {
    Producer.findOne(Filter(req, {
      'events.products._id': req.params.productId,
      //'userId': req.userId
    }), 'events.$')
      .then(producer => {
        if(!producer && !producer.events[0]) {
          return Result.NotFound.NoRecordsFound(res)
        }
        const products = producer.events[0].products.id(req.params.productId)
        return Result.Success.SuccessOnSearch(res, products)
      }).catch(err => {
        if(err.kind === 'ObjectId') {
          return Result.NotFound.NoRecordsFound(res)
        }
        return Result.Error.ErrorOnSearch(res)
      })
  },

  // Update product
  update: async (req, res) => {
    if(!req.body) {
      return Result.Error.RequiredBody(res)
    }

    Producer.updateMany(
      {
        //'userId': req.userId
      }, 
      { 
        $set: {
          'events.$[].products.$[product].name': req.body.name,
          'events.$[].products.$[product].value': req.body.value,
          'events.$[].products.$[product].color': req.body.color
        }
      },
      {
        arrayFilters: [{ 
          'product._id': req.params.productId
        }]
      }, (err) => {
        if (err) 
          return Result.Error.ErrorOnUpdate(res, err.message)
        return Result.Success.SuccessOnUpdate(res)
      })
  },

  // Delete product
  delete: async (req, res) => {
    Producer.updateOne({ 
      'events.products._id': req.params.productId,
      //'userId': req.userId
    }, { 
      $pull: { 
        'events.$.products': { '_id': req.params.productId } 
      }
    },
    (err, numAffected) => {
      if (err) 
        return Result.Error.ErrorOnRemove(res)
      if (numAffected.nModified > 0)
        return Result.Success.SuccessOnRemove(res)
      return Result.Error.ErrorOnRemove(res)
    })
  }
}