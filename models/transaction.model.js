import mongoose from 'mongoose'
import { ProductSchema } from './product.model'

export const TransactionSchema = mongoose.Schema({
  _id : { type : String, required : true },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  },
  deviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device'
  },
  products: [ProductSchema],
  terminalCode: String,
  amount: Number,
  paymentMethod: Number,
  loggedUserDocument: String,
  cardAquiredCode: String,
  cardAuthorizationCode: String,
  cardBin: String,
  cardHolder: String,
  cardBrandCode: String,
  createdAt: Date
}, {
  timestamps: true
})

export default mongoose.model('Transaction', TransactionSchema)