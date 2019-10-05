import Producer from '../models/producer.model'
import Result from '../modules/result'
import _ from 'lodash'

export default {
  // Create device
  create: async (req, res) => {
    if(_.isEmpty(req.body)) {
      return Result.Error.RequiredBody(res)
    }

    const device = {
      name: req.body.name,
      menusIds: req.body.menusIds,
      isEnabled: true
    }

    Producer.updateOne({ 
      'events._id': req.params.eventId,
      'userId': req.userId
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

  // Find all devices
  findAll: async (req, res) => {
    Producer.findOne({
      'events._id': req.params.eventId,
      'userId': req.userId
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

  // Find one device
  findOne: async (req, res) => {
    Producer.findOne({
      'events.devices._id': req.params.deviceId,
      'userId': req.userId
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
        return Result.Error.ErrorOnSearch(res)
      })
  },

  // Update device
  update: async (req, res) => {
    if(!req.body) {
      return Result.Error.RequiredBody(res)
    }

    Producer.updateMany(
      {
        'userId': req.userId
      },
      { 
        $set: {
          'events.$[].devices.$[device].name': req.body.name,
          'events.$[].devices.$[device].menusIds': req.body.menusIds,
          'events.$[].devices.$[device].isEnabled': req.body.isEnabled
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

  // Delete device
  delete: async (req, res) => {
    Producer.updateOne({
      'events.devices._id': req.params.deviceId,
      'userId': req.userId
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