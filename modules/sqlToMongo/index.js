/* eslint-disable no-unused-vars */
import User from '../../models/user.model'

const exec = require('child_process').exec
const jarFile = `${__dirname}\\target\\sql-to-mongo.jar`

export default function run (query, callback) {
  query = query.replace(/"/g, '\'')  
  exec(`java -jar ${jarFile} -sql "${query}"`, (err, stdout) => {
    if (err) {
      callback(err)
    }
    eval(stdout.replace('db.', ''))
      .then(result => callback(result))
  })
}
