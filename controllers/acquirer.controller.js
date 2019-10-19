import Result from '../modules/result'

export default {
  findAll: async (req, res) => {
    const acquirers = [
      { name: 'Integrado', value: 'I' },
      { name: 'Externo', value: 'E' }
    ]
    
    return Result.Success.SuccessOnSearch(res, acquirers)
  }
}