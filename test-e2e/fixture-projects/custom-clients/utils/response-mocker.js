module.exports = ({
  method = "GET",
  url,
  host = "mock.host.com",
  status = 200,
  headers = {},
  body
}) => ({
  req: {
    method,
    url,
    _headers: [
      `${method.toUpperCase()} ${url}`,
      `host: ${host}`,
      "",
    ].join("\r\n"),
  },
  statusCode: status,
  headers,
  body,
})
