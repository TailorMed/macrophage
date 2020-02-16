module.exports = ({
  env = process.env,
  pkg: { name, version, buildInfo } = getPackageInfo(),
  load = require('require-yml'),
  merge = require('lodash/merge'),
}) => {
  const config = {
    vars: env,
    pkg: { name, version, buildInfo },
    logger: {
      levels: {
        runner:  'info',
        reporter: 'info',
        default:  'warn',
      },
      prettyPrint: true,
      prettyOptions: {
        ignore:        'version',
        translateTime: true,
        levelFirst:    true,
      },
    },
    clientsPath: './clients',
    suitesPath: './suites',
    suites: {},
  }

  loadSuitesPath(config.suitesPath, config)

  return config

  function loadSuitesPath(suitesPath, config) {
    load.onLoadError = err => { throw err }
    try {
      const loadedSuites = load(suitesPath, suiteConfig => {
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

function getPackageInfo() {
  try {
    return require( process.cwd() + '/package')
  } catch(e) {
      if ('MODULE_NOT_FOUND' == e.code) return {}
      throw e
  }
}
