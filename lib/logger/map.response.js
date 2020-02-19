module.exports = ({
  req,
  _req: {
    _header,
    method,
    path: url,
    headers,
    jar,
    form,
    data,
    body = form || data,
  } = req,
  err,
  statusCode: status,
  headers: rHeaders,
  body: rbody,
  duration,
}) => ({
  sent: {
    method,
    url,
    header: _header.split(/\r?\n/),
    cookies: jar && jar._jar.toJSON().cookies,
  },
  duration,
  err: err && err.toJSON(),
  received: {
    status,
    headers: rHeaders,
    body: rbody //TBD: obfuscate phi fields
  },
})
