import mongoose from 'mongoose'
import { EventSchema } from './event.model'

export const ProducerSchema = mongoose.Schema({
  socialReason: String,
  cnpj: Number,
  cep: Number,
  state: String,
  city: String,
  address: String,
  addressNumber: Number,
  email: String,
  phone: Number,
  events: [EventSchema],
  isEnabled: Boolean,
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
})

export default mongoose.model('Producer', ProducerSchema)