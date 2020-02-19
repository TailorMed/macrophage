module.exports = ({
  config: {
    userPackage,
    version,
    logger: {
      levels,
      prettyPrint,
      prettyOptions,
    }
  },
  fs = require('fs'),
  pino = require('pino'),
  requestMapper = require('./map.request'),
  responseMapper = require('./map.response'),
}) => {
  const {assign} = Object;
  const rootLogger = pino({
    name: userPackage ? `macrophage<${userPackage}>` : 'macrophage',
    level: levels.default,
    prettyPrint:
      fs.existsSync('./node_modules/pino-pretty')
      && prettyPrint
      && prettyOptions,
    serializers: Object.assign(
      {},
      pino.stdSerializers, 
      {
        req: requestMapper,
        res: responseMapper,
      }
    )
  }).child({version});

  return assign(rootLogger, {
    of: module => rootLogger.child({ module, level: levels[module] || levels.default }),
  });
};
