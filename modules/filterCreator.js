import _ from 'lodash'

const filterCreator = (req, query) => {
  Object.entries(req.query)
    .map((column) => {
      if ((column[0].match(new RegExp('\\.', 'gi'))||[]).length <= 1) {
        if (column[1].match(/^[0-9]+$/))
          query = {...query, [column[0]]: column[1]}
        else
          query = {...query, [column[0]]: {$regex: column[1], $options: 'i'}}
      }
      else
      {
        console.log('xxxxxxxxxxxxxxxxxxxxxxxx', column)
      }
    })
  return query
}

export default filterCreator