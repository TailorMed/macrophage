//TBD: replace the mocks with real respons/request objects
const mockResponse = require('../utils/response-mocker')

module.exports = (ioc, init = false) => ({
  ioc,
  initialize(ioc) {
    this.initIoc = ioc
    init = true
    return  Promise.resolve()
  },
  api1: (...args) =>
    init
    ? Promise.resolve(mockResponse({
        method: "GET",
        url: "/mock/api-1",
        headers: { 'content-type': 'application/json'},
        body: { hello: "world", args }
      }))
    : Promise.reject(new Error('not initiated')),
  api2: (...args) =>
    init
    ? Promise.resolve(mockResponse({
        method: "POST",
        url: "/mock/api-2",
        headers: { 'content-type': 'application/json'},
        status: 201
        body: { success: true, args }
      }))
    : Promise.reject(new Error('not initiated')),
})
