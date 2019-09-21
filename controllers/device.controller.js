import Producer from '../models/producer.model'
import Result from '../modules/result'
import _ from 'lodash'

export default {
  // Create event
  create: async (req, res) => {
    if(_.isEmpty(req.body)) {
      return Result.Error.RequiredBody(res)
    }

    const device = {
      name: req.body.name,
      menusIds: JSON.parse(req.body.menusIds)
    }

    Producer.updateOne({ 
      'events._id': req.params.eventId 
    },
    {
      $push: {
        'events.$.devices': device
      }
    },
    (err) => {
      if (err) 
        return Result.Error.ErrorOnSave(res)
      return Result.Success.SuccessOnSave(res)
    })
  },

  // Find all events
  findAll: async (req, res) => {
    Producer.findOne({
      'events._id': req.params.eventId
    }, 'events.$')
      .then(producer => {
        if(!producer) {
          return Result.NotFound.NoRecordsFound(res)
        }
        const event = producer.events.id(req.params.eventId)
        return Result.Success.SuccessOnSearch(res, event.devices)
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
      'events.devices._id': req.params.deviceId
    }, 'events.$')
      .then(producer => {
        if(!producer && !producer.events[0]) {
          return Result.NotFound.NoRecordsFound(res)
        }
        const devices = producer.events[0].devices.id(req.params.deviceId)
        return Result.Success.SuccessOnSearch(res, devices)
      }).catch(err => {
        if(err.kind === 'ObjectId') {
          return Result.NotFound.NoRecordsFound(res)
        }
        return Result.Error.ErrorOnSearch(res, err.message)
      })
  },

  // Update event
  update: async (req, res) => {
    if(!req.body) {
      return Result.Error.RequiredBody(res)
    }

    Producer.updateMany(
      {},
      { 
        $set: {
          'events.$[].devices.$[device].name': req.body.name,
          'events.$[].devices.$[device].menusIds': JSON.parse(req.body.menusIds)
        }
      },
      {
        arrayFilters: [{ 
          'device._id': req.params.deviceId
        }]
      }, (err) => {
        if (err) 
          return Result.Error.ErrorOnUpdate(res)
        return Result.Success.SuccessOnUpdate(res)
      })
  },

  // Delete event
  delete: async (req, res) => {
    Producer.updateOne({ 
      'events.devices._id': req.params.deviceId
    }, { 
      $pull: { 
        'events.$.devices': { '_id': req.params.deviceId } 
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