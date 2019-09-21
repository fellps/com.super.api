import Producer from '../models/producer.model'
import Result from '../modules/result'
import _ from 'lodash'

export default {
  // Create event
  create: async (req, res) => {
    if(_.isEmpty(req.body)) {
      return Result.Error.RequiredBody(res)
    }

    Producer.updateOne({ 
      'events._id': req.params.eventId 
    },
    {
      $push: {
        'events.$.menus': req.body
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
      'events.menus._id': req.params.menuId
    }, 'events.$')
      .then(producer => {
        if(!producer && !producer.events[0]) {
          return Result.NotFound.NoRecordsFound(res)
        }
        const menu = producer.events[0].menus.id(req.params.menuId)
        return Result.Success.SuccessOnSearch(res, menu)
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
          'events.$[].menus.$[menu].name': req.body.name,
          'events.$[].menus.$[menu].products': JSON.parse(req.body.products) 
        }
      },
      {
        arrayFilters: [{ 
          'menu._id': req.params.menuId
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
      'events.menus._id': req.params.menuId
    }, { 
      $pull: { 
        'events.$.menus': { '_id': req.params.menuId } 
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