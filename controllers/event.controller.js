import Producer from '../models/producer.model'
import Result from '../modules/result'
import Filter from '../modules/filterCreator'
import _ from 'lodash'

export default {
  // Create event
  create: async (req, res) => {
    if(_.isEmpty(req.body)) {
      return Result.Error.RequiredBody(res)
    }

    if (req.body.addressNumber === 'NaN')
      req.body.addressNumber = '0'

    Producer.findOne({
      _id: req.params.producerId,
      //userId: req.userId
    })
      .then(producer => {
        if(!producer) {
          return Result.NotFound.NoRecordsFound(res)           
        }
        producer.events.push({
          name: req.body.name,
          startDate: req.body.startDate,
          endDate: req.body.endDate,
          cep: req.body.cep,
          state: req.body.state,
          city: req.body.city,
          address: req.body.address,
          addressNumber: req.body.addressNumber,
          description: req.body.description,
          managerPassword: req.body.managerPassword,
          isEnabled: true
        })
        producer.save()
        return Result.Success.SuccessOnSave(res, producer)
      }).catch(err => {
        if(err.kind === 'ObjectId') {
          return Result.NotFound.NoRecordsFound(res)
        }
        return Result.Error.ErrorOnSearch(res)
      })
  },

  // Find all events
  findAll: async (req, res) => {
    Producer.find(Filter(req, {
      //userId: req.userId,
      events: {$exists: true, $not: {$size: 0}}
    }))
      .then(producers => {
        let events = []
        producers.forEach((producer) => {
          producer.events.forEach(event => {
            events.push(event)
          })
        })
        return Result.Success.SuccessOnSearch(res, events)
      }).catch(err => {
        if(err.kind === 'ObjectId') {
          return Result.NotFound.NoRecordsFound(res)
        }
        return Result.Error.ErrorOnSearch(res, err.message)
      })
  },

  // Find one event
  findOne: async (req, res) => {
    Producer.findOne(Filter(req, {
      'events._id': req.params.eventId,
      //'userId': req.userId
    }), 'events.$')
      .then(producer => {
        if(!producer) {
          return Result.NotFound.NoRecordsFound(res)
        }
        let event = producer.events.id(req.params.eventId)
        event.producerId = producer._id
        return Result.Success.SuccessOnSearch(res, event)
      }).catch(err => {
        if(err.kind === 'ObjectId') {
          return Result.NotFound.NoRecordsFound(res)
        }
        return Result.Error.ErrorOnSearch(res)
      })
  },

  // Update event
  update: async (req, res) => {
    if(!req.body) {
      return Result.Error.RequiredBody(res)
    }

    if (req.body.addressNumber === 'NaN')
      req.body.addressNumber = '0'

    Producer.findOneAndUpdate({
      'events._id': req.params.eventId,
      //'userId': req.userId
    }, {
      'events.$.name': req.body.name,
      'events.$.startDate': req.body.startDate,
      'events.$.endDate': req.body.endDate,
      'events.$.cep': req.body.cep,
      'events.$.state': req.body.state,
      'events.$.city': req.body.city,
      'events.$.address': req.body.address,
      'events.$.addressNumber': req.body.addressNumber,
      'events.$.description': req.body.description,
      'events.$.managerPassword': req.body.managerPassword,
      'events.$.isEnabled': req.body.isEnabled == 'true'
    })
      .then(producer => {
        if(!producer) {
          return Result.NotFound.NoRecordsFound(res)
        }
        return Result.Success.SuccessOnUpdate(res)
      }).catch(err => {
        if(err.kind === 'ObjectId') {
          return Result.NotFound.NoRecordsFound(res)
        }
        return Result.Error.ErrorOnSearch(res, err.message)
      })
  },

  // Delete event
  delete: async (req, res) => {
    Producer.findOne({
      'events._id': req.params.eventId,
      //'userId': req.userId
    })
      .then(producer => {
        if(!producer) {
          return Result.NotFound.NoRecordsFound(res)
        }
        producer.events.id(req.params.eventId).remove()
        producer.save()
        return Result.Success.SuccessOnRemove(res)
      }).catch(err => {
        if(err.kind === 'ObjectId' || err.name === 'NotFound') {
          return Result.NotFound.NoRecordsFound(res)                         
        }
        return Result.InternalError.ErrorOnOperation(res)
      })
  }
}