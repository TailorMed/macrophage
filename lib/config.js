module.exports = ({
  env = process.env,
  pkg: {
    name,
    version,
    buildInfo,
  } = require('../package'),
  config = require('config'),
  load = require('require-yml'),
  merge = require('lodash/merge'),
}) => {

  config.vars = env
  config.pkg = { name, version, buildInfo }

  if ('string' == typeof config.suites) loadSuitesPath(config);

  return config

  function loadSuitesPath(config) {
    //load.onLoadError = err => { throw err }
    try {
      const loadedSuites = load(config.suites, suiteConfig => {
        merge(config, suiteConfig)
        //TBD: support user-injected custom-env-vars
      })

    } catch(e) {
      e.message = 'Failed to load suites: ' + e.message
      e.providedSuitesPath = config.suites
      throw e
    }
  }
};
