import Producer from '../models/producer.model'
import Result from '../modules/result'
import Filter from '../modules/filterCreator'
import _ from 'lodash'
import uuid from 'uuid'

export default {
  // Create menu
  create: async (req, res) => {
    if(_.isEmpty(req.body)) {
      return Result.Error.RequiredBody(res)
    }

    const session = await Producer.startSession()
    session.startTransaction()

    try {     
      const menu = {
        _id: uuid(),
        name: req.body.name,
        isEnabled: true,
        productsIds: Object.keys(req.body.products)
      }
  
      var products = Object.keys(req.body.products).map((key) => {
        let arr = []
        req.body.products[key]['_id'] = key
        return arr[key] = req.body.products[key]
      })

      await Producer.findOneAndUpdate({
        'events._id': req.params.eventId,
        'userId': req.userId
      },
      {
        $push: {
          'events.$.products': products
        }
      })

      await Producer.findOneAndUpdate({
        'events._id': req.params.eventId,
        'userId': req.userId
      },
      {
        $push: {
          'events.$.menus': menu
        }
      })
  
      await session.commitTransaction()
      session.endSession()

      return Result.Success.SuccessOnSave(res)
    } catch (err) {
      await session.abortTransaction()
      session.endSession()

      return Result.Error.ErrorOnSave(res)
    }
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
        const menus = event.menus.map((menu) => {
          return { 
            _id: menu._id, 
            name: menu.name,
            isEnabled: menu.isEnabled,
            productsIds: menu.productsIds,
            totalProducts: menu.productsIds.length
          }
        }, [])
        return Result.Success.SuccessOnSearch(res, menus)
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

        Producer.aggregate([
          { $match: { 'userId': req.userId } }, 
          { $unwind: '$events' }, 
          { $unwind: '$events.products' }, 
          { 
            $match: { 
              'events.products._id': { $in: menu.productsIds } 
            } 
          },
          { $group: { _id: '$events.products' } }
        ])
          .then(products => {
            products = products.map((key) => {
              return key._id
            }, [])

            return Result.Success.SuccessOnSearch(res, {
              _id: menu._id, 
              name: menu.name,
              isEnabled: menu.isEnabled,
              products: products,
              productsIds: menu.productsIds,
              totalProducts: menu.productsIds.length
            })
          })
          .catch(err => {
            if(err.kind === 'ObjectId') {
              return Result.NotFound.NoRecordsFound(res)
            }
            return Result.Error.ErrorOnSearch(res)
          })
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
          'events.$[].menus.$[menu].isEnabled': req.body.isEnabled,
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