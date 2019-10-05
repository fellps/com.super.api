import mongoose from 'mongoose'

export const DeviceSchema = mongoose.Schema({
  name: String,
  menusIds: [],
  isEnabled: Boolean
}, {
  timestamps: true
})

export default mongoose.model('Device', DeviceSchema)