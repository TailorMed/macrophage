const { assign } = Object

module.exports = (ioc) => {
  const { logger, config, client } = ioc
  const { clients } = config

  const log = logger.of('clients')

  const inits = []
  Object.entries(clients).forEach(([clientName, clientCfg]) => {
    if ('string' == typeof clientCfg) clientCfg = { module: clientCfg }
    const {
      module: moduleName,
      factoryOptions,
      initMethod = "init",
      initOptions,
    } = clientCfg

    log.trace({ clientName, clientCfg }, 'loading client: %s', clientName)
    //throws synchronously:
    const module = loadClientModule(moduleName, { clientName, clientCfg })

    const constructedClient =
      client[clientName] =
        'undefined' == typeof factoryOptions
        ? module
        : module({...ioc, ...factoryOptions})

    const requiresInit = 'undefined' != typeof initOptions
    log.info({ clientName, clientCfg, requiresInit }, 'loaded client: %s', clientName)

    if (!requiresInit) return

    inits.push(() =>
      log.debug({clientName, initOptions}, 'initiating client: %s', clientName) ||
      constructedClient[initMethod]({ ...ioc, ...initOptions })
      .then(initiatedClient => initiatedClient && (client[clientName] = initiatedClient))
    )
  })

  log.info({ initClients: inits.length }, "clients that require init: %s", inits.length)

  const initClients = () => Promise.all(inits.map(init => init()))

  return initClients

  function loadClientModule(moduleName, ctx ) {
    const requirePath =
      moduleName.startsWith('./')
      ? process.cwd() + moduleName.slice(1)
      : moduleName //npm package

    try {
      return require(requirePath)
    } catch(e) {
      e.message = "could not find module for client: " + e.message
      e.moduleName = moduleName
      throw assign(e, ctx)
    }
  }
}