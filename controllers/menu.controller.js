import Producer from '../models/producer.model'
import Result from '../modules/result'
import Filter from '../modules/filterCreator'
import _ from 'lodash'

export default {
  // Create menu
  create: async (req, res) => {
    if(_.isEmpty(req.body)) {
      return Result.Error.RequiredBody(res)
    }

    const menu = {
      name: req.body.name,
      productsIds: JSON.parse(req.body.productsIds)
    }

    Producer.updateOne({ 
      'events._id': req.params.eventId,
      'userId': req.userId
    },
    {
      $push: {
        'events.$.menus': menu
      }
    },
    (err) => {
      if (err) 
        return Result.Error.ErrorOnSave(res)
      return Result.Success.SuccessOnSave(res)
    })
  },

  // Find all menus
  findAll: async (req, res) => {
    Producer.findOne(Filter(req, {
      'events._id': req.params.eventId,
      'userId': req.userId
    }), 'events.$')
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

  // Find one menu
  findOne: async (req, res) => {
    Producer.findOne(Filter(req, {
      'events.menus._id': req.params.menuId,
      'userId': req.userId
    }), 'events.$')
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
        return Result.Error.ErrorOnSearch(res)
      })
  },

  // Update menu
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
          'events.$[].menus.$[menu].name': req.body.name,
          'events.$[].menus.$[menu].productsIds': JSON.parse(req.body.productsIds) 
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

  // Delete menu
  delete: async (req, res) => {
    Producer.updateOne({ 
      'events.menus._id': req.params.menuId,
      'userId': req.userId
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