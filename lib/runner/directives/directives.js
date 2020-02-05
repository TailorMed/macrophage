const { assign } = Object;
const { isArray } = Array;
const getVal = require('lodash/get');
const setVal = require('lodash/set');

module.exports = (ioc) => {
  const customModules = {};
  ioc.loadCustomHandler = loadCustomHandler;

  return {
    fire: require('./fire')(ioc),

    expect: require('./expect')(ioc),

    keep: ({ suiteName, suite, stepName, step, log, config }) => {
      log = log.child({suiteName, stepName, directive: "keep", keep: config })
      log.debug("keep directive loaded")

      return () => {
        const kept =
          Object.keys(config)
          .reduce(
            (kept, saveAs) => setVal(kept, saveAs, getVal(step.response, config[saveAs])),
            {},
          )

        log.debug({ kept }, "step: %s/%s/keep", suiteName, stepName)
        Object.assign(suite, kept)
      }
    },
  }

  function loadCustomHandler(handlerSpecifierStr, ctx) {
    const nameParts = handlerSpecifierStr.split('.')
    const handlerName = nameParts.pop() //last part available always
    const helperModule = nameParts.pop() || ctx.suiteName //possible module name prefix

    try {
      //TBD: do we want to support packages from node_modules 
      let module = customModules[helperModule] || require(`../../../suite-helpers/${helperModule}`)

      module = customModules[helperModule] =
        'function' == typeof module
        ? module(ioc) //is factory
        : module //is singleton

      const handler = module[handlerName]
      if ('function' != typeof handler) throw { message: "named handler is missing or not a function" }
      return handler
    } catch(e) {
      throw assign(new Error("could not retrieve custom handler from suite-helper module"), {
        ...ctx,
        err: e.message,
        handlerSpecifierStr,
        helperModule,
        handlerName,
      })
    }
  }
}