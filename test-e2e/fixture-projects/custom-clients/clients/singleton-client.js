//TBD: replace the mocks with real respons/request objects

module.exports = (ioc) => ({
  api1: (...args) => Promise.resolve(mockResponse({
    method: "GET",
    url: "/mock/api-1",
    headers: { 'content-type': 'application/json'},
    body: { hello: "world" }
  })),
  api2: (...args) => Promise.resolve({
    method: "POST",
    url: "/mock/api-2",
    headers: { 'content-type': 'application/json'},
    status: 201
    body: { success: true }
  }),
})
