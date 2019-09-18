import Messages from './messages'
import _ from 'lodash'

const basicResult = {
  error: false,
  errorCode: void (0),
  message: ''
}

const _success = (code, res, resultData = {}) => {
  const result = {
    ...basicResult,
    data: resultData,
    message: Messages[code] || 'Server Problem'
  }
  return res.status(200).send(result)
}

const _error = (code, res, resultData = {}) => {
  const result = {
    ...basicResult,
    data: resultData,
    error: true,
    errorCode: code,
    errorMessage: code,
    message: Messages[code] || 'Server Problem',
  }
  return res.status(400).send(result)
}

const _unauthorized = (code, res, resultData = {}) => {
  const result = {
    ...basicResult,
    data: resultData,
    error: true,
    errorCode: code,
    errorMessage: code,
    message: Messages[code] || 'Server Problem',
  }
  return res.status(401).send(result)
}
  
const _warning = (code, res, resultData = {}) => {
  const result = {
    ...basicResult,
    data: resultData,
    error: true,
    errorCode: code,
    errorMessage: code,
    message: Messages[code] || 'Server Problem',
  }
  return res.status(200).send(result)
}

const _notFound = (code, res, resultData = {}) => {
  const result = {
    ...basicResult,
    data: resultData,
    error: true,
    errorCode: code,
    errorMessage: code,
    message: Messages[code] || 'Server Problem',
  }
  return res.status(404).send(result)
}

const _internalError = (code, res, resultData = {}) => {
  const result = {
    ...basicResult,
    data: resultData,
    error: true,
    errorCode: code,
    errorMessage: code,
    message: Messages[code] || 'Server Problem',
  }
  return res.status(500).send(result)
}

const _forbidden = (code, res, resultData = {}) => {
  const result = {
    ...basicResult,
    data: resultData,
    error: true,
    errorCode: code,
    errorMessage: code,
    message: Messages[code] || 'Server Problem',
  }
  return res.status(403).send(result)
}

const mapMessages = (fn) => {
  return _.mapValues(Messages, (o, code) => (res, resultData) => fn(code, res, resultData))
}

const Result = {
  Error: mapMessages(_error),
  Success: mapMessages(_success),
  Warning: mapMessages(_warning),
  NotFound: mapMessages(_notFound),
  InternalError: mapMessages(_internalError),
  Unauthorized: mapMessages(_unauthorized),
  Forbidden: mapMessages(_forbidden)
}

export default Result