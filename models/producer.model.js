import mongoose from 'mongoose'
import EventSchema from './event.model'

const ProducerSchema = mongoose.Schema({
  socialReason: String,
  cnpj: Number,
  cep: Number,
  state: String,
  city: String,
  address: String,
  addressNumber: Number,
  email: String,
  phone: Number,
  events: [EventSchema]
}, {
  timestamps: true
})

export default mongoose.model('Producer', ProducerSchema)