require('error-stringify')({ splitStackTrace: true })
const config = require('../lib/config')({})
const logger = require('../lib/logger')({config})

const log = logger.of('bin/cli')
log.info('(: starting')
log.debug({...config, vars: undefined }, 'got initial settings')
log.trace({ env: config.vars }, 'got env vars')

process.once('SIGINT', shutdown)
process.once('SIGTERM', shutdown)
process.on('uncaughtException', shutdown)
process.on('unhandledRejection', shutdown)

require('../lib')({ config, logger, Promise: require('bluebird')})
  .then(results => process.exit( results.summary.failed ))

function shutdown(signal) {
  signal instanceof Error
  ? log.fatal({ error: signal.toJSON() }, 'break due error')
  : log.warn({ signal }, 'break signal accepted')

  process.exit(signal ? 1 : 0)
}
