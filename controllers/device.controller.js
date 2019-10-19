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
      acquirer: req.body.acquirer,
      isQRCodeEnabled: req.body.isQRCodeEnabled,
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
        const devices = event.devices.map((device) => {
          return {
            _id: device._id, 
            name: device.name,
            isEnabled: device.isEnabled,
            acquirer: device.acquirer,
            isQRCodeEnabled: device.isQRCodeEnabled,
            menusIds: device.menusIds,
            totalMenus: device.menusIds.length
          }
        }, [])
        return Result.Success.SuccessOnSearch(res, devices)
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
          'events.$[].devices.$[device].acquirer': req.body.acquirer,
          'events.$[].devices.$[device].isEnabled': req.body.isEnabled,
          'events.$[].devices.$[device].isQRCodeEnabled': req.body.isQRCodeEnabled
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