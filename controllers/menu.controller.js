import Producer from '../models/producer.model'
import Result from '../modules/result'
import _ from 'lodash'

export default {
  // Create event
  create: async (req, res) => {
    if(_.isEmpty(req.body)) {
      return Result.Error.RequiredBody(res)
    }

    Producer.update(
      { 'events._id': req.params.eventId },
      {
        $push: {
          'events.$.menus': req.body
        }
      },
      (err) => {
        if (err) return Result.Error.ErrorOnSave(res)
        return Result.Success.SuccessOnSave(res)
      }
    )
  },

  // Find all events
  findAll: async (req, res) => {
    Producer.findOne({
      'events._id': req.params.eventId
    })
      .then(producer => {
        if(!producer) {
          return Result.NotFound.NoRecordsFound(res)
        }
        const event = producer.events.id(req.params.eventId)
        return Result.Success.SuccessOnSearch(res, event.menus)
      }).catch(err => {
        if(err.kind === 'ObjectId') {
          return Result.NotFound.NoRecordsFound(res)
        }
        return Result.Error.ErrorOnSearch(res)
      })
  },

  // Find one event
  findOne: async (req, res) => {
    Producer.findOne({
      'events._id': req.params.eventId
    })
      .then(producer => {
        if(!producer) {
          return Result.NotFound.NoRecordsFound(res)
        }
        const event = producer.events.id(req.params.eventId)
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

    Producer.findOneAndUpdate({
      'events._id': req.params.eventId
    }, {
      'events.$.name': req.body.name,
      'events.$.startDate': req.body.startDate,
      'events.$.endDate': req.body.endDate,
      'events.$.cep': req.body.cep,
      'events.$.state': req.body.state,
      'events.$.city': req.body.city,
      'events.$.address': req.body.address,
      'events.$.addressNumber': req.body.addressNumber
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
        return Result.Error.ErrorOnSearch(res)
      })
  },

  // Delete event
  delete: async (req, res) => {
    Producer.findOne({
      'events._id': req.params.eventId
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