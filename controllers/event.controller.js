import Producer from '../models/producer.model'
import Result from '../modules/result'
import Filter from '../modules/filterCreator'
import _ from 'lodash'
import MD5 from 'md5'
import moment from 'moment-timezone'
import uuid from 'uuid'
import mongoose from 'mongoose'

export default {
  // Create event
  create: async (req, res) => {
    if(_.isEmpty(req.body)) {
      return Result.Error.RequiredBody(res)
    }

    if (req.body.addressNumber === 'NaN')
      req.body.addressNumber = '0'

    const uploadPath = __dirname + '/../uploads/'
    let imagePath = ''
    
    if (req.files !== null) {
      const image = req.files.image
      const name = MD5(Math.random().toString(36) + image.md5) + '.' + image.name.split('.').pop()
  
      image.mv(uploadPath + name, async (err) => {
        if (err) return Result.Error.ErrorOnImageSave()
      })

      imagePath = '/uploads/' + name
    } 

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
          cashierClosingPassword: req.body.cashierClosingPassword,
          image: imagePath,
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

  // Clone event
  clone: async (req, res) => {
    try {
      const createdAt = moment().tz('America/Sao_Paulo').format('YYYY-MM-DD HH:mm:ss.SSS')
      const producer = await Producer.findOne({
        'events._id': req.params.eventId
      }, 'events.$')

      let event = producer.events.id(req.params.eventId)
      event.producerId = producer._id

      const products = event.products.map(product => {
        return {
          _id: uuid(),
          fromId: product._id,
          name: product.name,
          color: product.color,
          value: product.value,
        }
      })

      const menus = event.menus.map(menu => {
        const productsIds = menu.productsIds.map(productId => {
          const product = products.filter(product => product.fromId == productId)
          if (product.length) {
            return product[0]._id
          }
        })
        return {
          _id: uuid(),
          fromId: menu._id,
          isEnabled: menu.isEnabled,
          name: menu.name,
          updatedAt: createdAt,
          productsIds,
        }
      })

      const devices = event.devices.map(device => {
        const menusIds = device.menusIds.map(menuId => {
          const menu = menus.filter(menu => menu.fromId == menuId)
          if (menu.length) {
            return menu[0]._id
          }
        })
        return {
          _id: mongoose.Types.ObjectId(),
          fromId: device._id,
          name: device.name,
          acquirer: device.acquirer,
          isEnabled: device.isEnabled,
          isQRCodeEnabled: device.isQRCodeEnabled,
          menusIds,
        }
      })

      const newEvent = await Producer.findOne({
        _id: event.producerId,
      })

      const newEventId = mongoose.Types.ObjectId()

      newEvent.events.push({
        _id: newEventId,
        fromId: event._id,
        name: `[CLONE] - ${event.name}`,
        startDate: event.startDate,
        endDate: event.endDate,
        cep: event.cep,
        state: event.state,
        city: event.city,
        address: event.address,
        addressNumber: event.addressNumber,
        description: event.description,
        managerPassword: event.managerPassword,
        cashierClosingPassword: event.cashierClosingPassword,
        image: event.image,
        isEnabled: true,
        createdAt,
        updatedAt: createdAt,
      })
      const eventSaved = await newEvent.save()

      await Producer.updateOne({
        'events._id': newEventId,
      },
      {
        $set: {
          'events.$.products': products
        }
      })

      await Producer.updateOne({
        'events._id': newEventId,
      },
      {
        $set: {
          'events.$.menus': menus
        }
      })

      await Producer.updateOne({ 
        'events._id': newEventId,
      },
      {
        $set: {
          'events.$.devices': devices
        }
      })

      return Result.Success.SuccessOnSave(res, eventSaved)
    } catch (err) {
      if(err.kind === 'ObjectId') {
        return Result.NotFound.NoRecordsFound(res)
      }
      return Result.Error.ErrorOnSave(res, err.message)
    }
  },

  // Find all events
  findAll: async (req, res) => {
    const match = Filter(req, {
      events: {$exists: true, $not: {$size: 0}}
    })

    Producer.aggregate([
      { $match: match },
      { $unwind: '$events' },
      // { $sort: { 'events.startDate': 1 }},
      {
        $group: {
          _id: null,
          events: {
            $push: {
              _id: '$events._id',
              name: '$events.name',
              address: '$events.address',
              startDate: '$events.startDate'
            }
          }
        }
      }
    ])
      .then(events => {
        const data = events.shift().events
        return Result.Success.SuccessOnSearch(res, data)
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
    
    const uploadPath = __dirname + '/../uploads/'
    
    if (req.files !== null) {
      const image = req.files.image
      const name = MD5(Math.random().toString(36) + image.md5) + '.' + image.name.split('.').pop()

      image.mv(uploadPath + name, async (err) => {
        if (err) return Result.Error.ErrorOnImageSave()
        
        Producer.findOneAndUpdate({
          'events._id': req.params.eventId
        },
        {
          'events.$.image': '/uploads/' + name
        })
          .then()
          .catch(err => {
            if(err.kind === 'ObjectId') {
              return Result.NotFound.NoRecordsFound(res)
            }
            return Result.Error.ErrorOnImageSave(res, err.message)
          })
      })
    }

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
      'events.$.cashierClosingPassword': req.body.cashierClosingPassword,
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