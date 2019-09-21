import mongoose from 'mongoose'

export const UserSchema = mongoose.Schema({
  name: String,
  cpf: Number,
  birthdate: Date,
  email: String,
  phone: Number,
  password: String
}, {
  timestamps: true
})

export default mongoose.model('User', UserSchema)