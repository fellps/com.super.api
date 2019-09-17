import express from 'express'
import bodyParser from 'body-parser'
import mongoose from 'mongoose'
import cors from 'cors'
import routes from './routes'
import 'dotenv/config'

var app = express()

//Enable CORS for all HTTP methods
app.use(cors())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

app.use((req, res, next) => {
  console.log(`Request coming => ${req.originalUrl}`)
  next() //this will invoke next middleware function
})

mongoose.Promise = global.Promise

// Connecting to the database
mongoose.connect(process.env.DB_HOST, {
  useUnifiedTopology: true,
  useNewUrlParser: true,
  useCreateIndex: true
}).then(() => {
  console.log('Successfully connected to the database')
}).catch(err => {
  console.log('Could not connect to the database. Exiting now...', err)
  process.exit()
})

app.use('/', routes)
// listen on port 3000
app.listen(process.env.API_PORT, () => {
  console.log(`Server is listening on port ${process.env.API_PORT}!`)
})