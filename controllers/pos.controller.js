import Result from '../modules/result'
import Producer from '../models/producer.model'
import mongoose from 'mongoose'

export default {
  // Configure POS
  config: async (req, res) => {
    Producer.findOne({
      'events.devices._id': mongoose.Types.ObjectId(req.body.IdPOS)
    }, 'events.$')
      .then(producer => {
        if(!producer && !producer.events[0]) {
          return Result.NotFound.NoRecordsFound(res)
        }
        
        const devices = producer.events[0].devices.id(req.body.IdPOS)
        return Result.Success.SuccessOnSearch(res, devices)
      }).catch(err => {
        if(err.kind === 'ObjectId') {
          return Result.NotFound.NoRecordsFound(res)
        }
        return Result.Error.ErrorOnSearch(res)
      })
  }
}