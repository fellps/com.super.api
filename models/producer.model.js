import mongoose from 'mongoose'

const ProducerSchema = mongoose.Schema({
  title: String,
  description: String
}, {
  timestamps: true
})

export default mongoose.model('Producer', ProducerSchema)