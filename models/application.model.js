import mongoose from 'mongoose'

export const ApplicationSchema = mongoose.Schema({
  clientId: String,
  clientSecret: String,
  code: String,
  accessToken: String,
  refreshToken: String,
  expiresIn: Number
}, {
  timestamps: true
})

export default mongoose.model('Application', ApplicationSchema)