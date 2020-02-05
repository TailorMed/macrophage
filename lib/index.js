module.exports = (ioc) => {
  const {
    Promise,
    config,
    logger,

    log = logger.of('main'),
    clientsFactory = require('./clients'),
    directivesFactory = require('./runner/directives'),
    runnerFactory = require('./runner'),
    reporterFactory = require('./reporter'),
  } = ioc

  log.debug('initializing')

  ioc.client = {}
  ioc.initClients = clientsFactory(ioc)
  ioc.directives = directivesFactory(ioc)
  ioc.runner = runnerFactory(ioc)
  ioc.reporter = reporterFactory(ioc)

  log.info('main loaded')

  return Promise.resolve()
  .then(ioc.initClients)
  .then(ioc.runner)
  .then(ioc.reporter)
}