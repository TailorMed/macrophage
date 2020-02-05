const { assign } = Object

module.exports = (ioc) => {
  const { logger, config, client } = ioc
  const { clients } = config

  const log = logger.of('clients')

  const inits = []
  Object.entries(clients).forEach(([clientName, clientCfg]) => {
    const {
      module: moduleName,
      factory: factoryOptions,
      initMethod = "init",
      init: initOptions,
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

  const initClients = () => Promise.all(inits)

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