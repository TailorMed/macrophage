module.exports = ({
  method,
  url,
  headers,
  jar,
  body,
  form,
}) => ({
  method,
  url,
  headers,
  cookies: jar && jar._jar.toJSON().cookies,
  body,   //TBD: obfuscate phi fields
  form,   //TBD: obfuscate phi fields
})