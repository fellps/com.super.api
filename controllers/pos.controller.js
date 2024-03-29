import Result from '../modules/result'
import Producer from '../models/producer.model'
import Transaction from '../models/transaction.model'

import moment from 'moment-timezone'
import mongoose from 'mongoose'
import _ from 'lodash'

function getObjectIdFromGuid(guid) {
  return guid.replace(/-/g, '').slice(0, 24)
}

export default {
  // Configure POS
  config: async (req, res) => {
    Producer.findOne({
      'events.devices._id': mongoose.Types.ObjectId(req.body.IdPOS)
    }, 'events.$')
      .then(event => {
        if(!event && !event.events[0]) {
          return Result.NotFound.NoRecordsFound(res)
        }

        const data = event.events.shift()

        const products = data.products
        const menus = []
        const devices = []
        const device = _.find(data.devices, {_id: mongoose.Types.ObjectId(req.body.IdPOS) })
        devices.push(device)

        _.forEach(device.menusIds, id => {
          const menu = _.find(data.menus, {_id: id })
          if (menu !== void(0)) {
            menus.push(menu)
          }
        })

        const result = {
          devices,
          products,
          menus,
          _id: data._id,
          name: data.name,
          image: 'https://api-prd.bdbar.com.br' + data.image,
          managerPassword: data.managerPassword,
          cashierClosingPassword: data.cashierClosingPassword
        }
        
        return Result.Success.SuccessOnSearch(res, result)
      }).catch(err => {
        if(err.kind === 'ObjectId') {
          return Result.NotFound.NoRecordsFound(res)
        }
        return Result.Error.ErrorOnSearch(res)
      })
  },

  // Save Transaction
  saveTransaction: async (req, res) => {
    if(_.isEmpty(req.body)) {
      return Result.Error.RequiredBody(res)
    }

    const session = await Transaction.startSession()
    session.startTransaction()

    try {

      var productsArr = JSON.parse(req.body.Products)

      var products = Object.keys(productsArr).map((key) => {
        let arr = []
        return arr[key] = {
          _id: productsArr[key].IdProduct,
          count: productsArr[key].Count,
          value: productsArr[key].Amount
        }
      })

      if (_.isEmpty(req.body.CanceledAt) || req.body.CanceledAt == '0001-01-01T00:00:00')
      {
        const transaction = new Transaction({
          _id: req.body.IdTransaction,
          eventId: mongoose.Types.ObjectId(getObjectIdFromGuid(req.body.IdEvent)),
          deviceId: mongoose.Types.ObjectId(getObjectIdFromGuid(req.body.IdPOS)),
          products: products,
          terminalCode: req.body.TerminalCode,
          amount: req.body.Amount,
          paymentMethod: req.body.PaymentMethod,
          loggedUserDocument: req.body.LoggedUserDocument,
          cardTransactionCode: req.body.CardTransactionCode,
          cardTransactionId: req.body.CardTransactionId,
          cardAuthorizationCode: req.body.CardAuthorizationCode,
          cardBin: req.body.CardBin,
          cardHolder: req.body.CardHolder,
          cardBrandCode: req.body.CardBrandCode,
          isDelivered: false,
          deliveryUser: '',
          createdAt: Date.parse(req.body.CreatedAt),
          canceledAt: null
        })
        await transaction.save()
      }
      else
      {
        await Transaction.updateOne({
          _id: req.body.IdTransaction,
        }, {
          canceledAt: Date.parse(req.body.CanceledAt)
        })
      }

      await session.commitTransaction()
      session.endSession()

      return Result.Success.SuccessOnSave(res)
    } catch (err) {
      await session.abortTransaction()
      session.endSession()

      //duplicate key error
      if (err.code == 11000)
      {
        return Result.Success.SuccessOnSave(res)
      }

      return Result.Error.ErrorOnSave(res)
    }
  },

  // Save Transaction Delivery
  saveTransactionDelivery: async (req, res) => {
    if(_.isEmpty(req.body)) {
      return Result.Error.RequiredBody(res)
    }

    const session = await Transaction.startSession()
    session.startTransaction()

    try {
      Transaction.findOneAndUpdate({
        _id: req.body.code
      }, {
        isDelivered: true,
        deliveryUser: req.body.cpf
      }, { new: true })
        .then(transaction => {
          if(!transaction) {
            return Result.NotFound.NoRecordsFound(res)
          }
          return Result.Success.SuccessOnUpdate(res)
        }).catch(err => {
          if(err.kind === 'ObjectId') {
            return Result.NotFound.NoRecordsFound(res)           
          }
          return Result.InternalError.ErrorOnOperation(res)
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

  // Update POS
  update: async (req, res) => {
    try {
      req.body.Date = req.body.Date.replace('-02:00', '-03:00')

      const date = moment(req.body.Date).tz('America/Sao_Paulo').format('YYYY-MM-DD HH:mm:ss')

      const dateObj = new Date(date)

      let result = {}

      result.dateTime = moment().tz('America/Sao_Paulo').format('YYYY-MM-DD HH:mm:ss.SSS Z')

      let menus = await Producer.aggregate([
        { $match: { 'events._id': mongoose.Types.ObjectId(getObjectIdFromGuid(req.body.IdEvent)) } },
        { $unwind: '$events' }, 
        { $unwind: '$events.menus' },
        { 
          $match: {
            'events._id': mongoose.Types.ObjectId(getObjectIdFromGuid(req.body.IdEvent)),
            'events.menus.updatedAt': { $gt: dateObj } 
          } 
        },
        { $group: { _id: '$events.menus' } }
      ])

      if (!_.isEmpty(menus))
      {
        let products = await Producer.aggregate([
          { $match: { 'events._id': mongoose.Types.ObjectId(getObjectIdFromGuid(req.body.IdEvent)) } },
          { $unwind: '$events' }, 
          { $unwind: '$events.products' },
          { $group: { _id: '$events.products' } }
        ])

        menus = menus.map((key) => {
          return key._id
        }, [])

        products = products.map((key) => {
          return key._id
        }, [])

        result.menus = menus
        result.products = products
      }

      let devices = await Producer.aggregate([
        { $match: { 'events.devices._id': mongoose.Types.ObjectId(getObjectIdFromGuid(req.body.IdPOS)) } },
        { $unwind: '$events' }, 
        { $unwind: '$events.devices' },
        { 
          $match: {
            'events.devices._id': mongoose.Types.ObjectId(getObjectIdFromGuid(req.body.IdPOS)),
            'events.devices.updatedAt': { $gt: dateObj } 
          } 
        },
        { $group: { _id: '$events.devices' } }
      ])

      if (!_.isEmpty(devices))
      {
        devices = devices.map((key) => {
          return key._id
        }, [])

        result.device = devices
      }
  
      return Result.Success.SuccessOnSearch(res, result)
    } catch (err) {
      if(err.kind === 'ObjectId') {
        return Result.NotFound.NoRecordsFound(res)
      }
      return Result.Error.ErrorOnSearch(res, err.message)
    }
  },
}