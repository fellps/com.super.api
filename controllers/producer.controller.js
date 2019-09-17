import Producer from '../models/producer.model'

export default {
  // Create producer
  create: (req, res) => {
    if(!req.body) {
      return res.status(400).send({
        message: 'Producer content can not be empty'
      })
    }

    const producer = new Producer({
      title: req.body.title || 'No producer title', 
      description: req.body.description
    })

    producer.save()
      .then(data => {
        res.send(data)
      }).catch(err => {
        res.status(500).send({
          message: err.message || 'Something wrong while creating the producer.'
        })
      })
  },

  // Find all producers
  findAll: (req, res) => {
    Producer.find()
      .then(products => {
        res.send(products)
      }).catch(err => {
        res.status(500).send({
          message: err.message || 'Something wrong while retrieving products.'
        })
      })
  },

  // Find one producer
  findOne: (req, res) => {

  },

  // Update producer
  update: (req, res) => {

  },

  // Delete producer
  delete: (req, res) => {

  }
}