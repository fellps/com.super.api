import Result from '../modules/result'
import Producer from '../models/producer.model'
import Transaction from '../models/transaction.model'

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
        
        return Result.Success.SuccessOnSearch(res, event.events.shift())
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

      const transaction = new Transaction({
        _id: req.body.IdTransaction,
        eventId: mongoose.Types.ObjectId(getObjectIdFromGuid(req.body.IdEvent)),
        deviceId: mongoose.Types.ObjectId(getObjectIdFromGuid(req.body.IdPOS)),
        products: products,
        terminalCode: req.body.TerminalCode,
        amount: req.body.Amount,
        paymentMethod: req.body.PaymentMethod,
        loggedUserDocument: req.body.LoggedUserDocument,
        cardAquiredCode: req.body.CardAquiredCode,
        cardAuthorizationCode: req.body.CardAuthorizationCode,
        cardBin: req.body.CardBin,
        cardHolder: req.body.CardHolder,
        cardBrandCode: req.body.CardBrandCode,
        isDelivered: false,
        deliveryUser: '',
        createdAt: Date.parse(req.body.CreatedAt)
      })
  
      await transaction.save()

      await session.commitTransaction()
      session.endSession()

      return Result.Success.SuccessOnSave(res)
    } catch (err) {
      await session.abortTransaction()
      session.endSession()

      if (err.code == 11000)
      {
        return Result.Success.SuccessOnSave(res)
      }

      return Result.Error.ErrorOnSave(res)
    }
  },

  saveTransactionDelivery: async (req, res) => {
    if(_.isEmpty(req.body)) {
      return Result.Error.RequiredBody(res)
    }

    console.log(req.body)
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
  }
}