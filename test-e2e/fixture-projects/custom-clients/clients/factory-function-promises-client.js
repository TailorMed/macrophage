//TBD: replace the mocks with real respons/request objects
const mockResponse = require('../utils/response-mocker')

module.exports = (ioc) => Promise.resolve({
  ioc,
  api1: (...args) => Promise.resolve(mockResponse({
    method: "GET",
    url: "/mock/api-1",
    headers: { 'content-type': 'application/json'},
    body: { hello: "world" },
  })),
  api2: (...args) => Promise.resolve(mockResponse({
    method: "POST",
    url: "/mock/api-2",
    headers: { 'content-type': 'application/json'},
    status: 201
    body: { success: true },
  })),
})
