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

    const session = await Producer.startSession()
    session.startTransaction()

    try {
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

    var productsIds = Object.keys(req.body.products).map((key) => {
      const id = req.body.products[key]['_id']
      return id !== undefined ? id : key
    })

    const session = await Producer.startSession()
    session.startTransaction()

    try {
      await Producer.updateMany(
        {
          'userId': req.userId
        }, 
        { 
          $set: {
            'events.$[].menus.$[menu].name': req.body.name,
            'events.$[].menus.$[menu].isEnabled': req.body.isEnabled == 'true',
            'events.$[].menus.$[menu].productsIds': productsIds
          }
        },
        {
          arrayFilters: [{ 
            'menu._id': req.params.menuId
          }]
        })

      Object.keys(req.body.products).forEach(async (key) => {
        const id = req.body.products[key]['_id']
        let color = req.body.products[key]['color']
        color = !_.isEmpty(color) ? color : '#000000'
        
        if (id !== undefined) {
          await Producer.updateMany(
            {
              'userId': req.userId
            }, 
            { 
              $set: {
                'events.$[].products.$[product].name': req.body.products[key]['name'],
                'events.$[].products.$[product].value': req.body.products[key]['value'],
                'events.$[].products.$[product].color': color
              }
            },
            {
              arrayFilters: [{ 
                'product._id': id !== undefined ? id : key
              }]
            })
        } else {
          await Producer.updateOne({
            'events.menus._id': req.params.menuId,
            'userId': req.userId
          },
          {
            $push: {
              'events.$.products': {
                '_id': key,
                'name': req.body.products[key]['name'],
                'value': req.body.products[key]['value'],
                'color': color
              }
            }
          })
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