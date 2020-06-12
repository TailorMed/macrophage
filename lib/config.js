module.exports = ({
  env = process.env,
  pkg: { name, version, buildInfo } = getPackageInfo(process.cwd()),
  mf = getPackageInfo('..'),
  args =
    require('yargs')
    .usage("macrophage --config <path>")
    .epilog(`
      Stay healthy and have fun :)
      `.replace(/\n      /g, '\n')
    )
    .version(false)
    .options({
      w: {
        alias: 'cwd',
        describe: 'current work dirrectory',
        default: process.cwd(),
      },
      p: {
        alias: 'profile',
        describe: 'path to config root. Configs are loaded using `require-yml`',
        default: './profiles/default.yaml',
      },
      e: {
        alias: 'echo-config',
        describe: 'ask the tool to justpretty-print the configurations it had found',
        type: 'boolean',
      },
      P: {
        alias: 'prettyPrint',
        describe: 'pretify json log to human-readable form (uses pino-pretty)',
        default: false,
      },
      l: {
        alias: 'logLevel',
        describe: 'log level: silly|trace|debug|info|warn|error|fatal',
        default: 'warn',
      },
      h: {
        alias: 'help',
        describe: 'you\'re looking at it...',
      },
    })
    .parse(process.argv.slice(2)),
  load = require('require-yml'),
  merge = require('lodash/merge'),
  setV = require('lodash/set'),
}) => {
  const config = merge(
    {
      cwd: args.cwd,
      envVars: {
        'logger.levels.default': 'DEFAULT_LOG_LEVEL',
        'run':                   'SUITES',
      },
      vars: env,
      userPackage: name,
      version: {
        [name]: version,
        macrophage: mf.version,
      },
      logger: {
        levels: {
          runner:  args.logLevel,
          default:  'warn',
        },
        prettyPrint: true,
        prettyOptions: {
          ignore:        'version',
          translateTime: true,
          levelFirst:    true,
        },
      },
    },
    args.config || {},
    load(args.profile),
  )


  Object.keys(config.envVars).forEach(path => {
    const env_var = config.envVars[path]
    const val = env[env_var]
    if (val) setV(config, path, val)
  })

  if ('string' == typeof config.suites) config.suites = config.suites.split(',').map(s => s.trim);
  if (Array.isArray(config.suites)) {
    const { suites } = config;
    config.suites = {};
    suites.forEach(path => loadSuitesPath(path, config));
  }

  if (!config.suites || 'object' != typeof config.suites) config.err = newNoSuitesFoundError(config);

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

function getPackageInfo( path ) {
  try {
    return require( path + '/package')
  } catch(e) {
      if ('MODULE_NOT_FOUND' == e.code) return {}
      throw e
  }
}

function newNoSuitesFoundError(config) {
  return new Error(`
    No suites found.
    Suites are expected to be found on the root-key \`suites\`, which can be:
     - an object of suites
     - a CSV-string of paths to merge into config from which suites are provided
     - an Array path strings to merge into config from which suites are provided
    once all paths are loaded, the root key \`suites\` is expected be an object of suites.
  `.trim().replace(/\n    /g, '\n'))
}
