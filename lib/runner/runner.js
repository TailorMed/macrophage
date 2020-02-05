const { assign } = Object;

module.exports = (ioc) => {
  const suites = loadSuites(ioc)
  const { Promise, logger } = ioc;
  const log = logger.of("runner")
  log.debug("runner constructed")

  return () => {
    log.info({ suites: suites.map(({name: n}) => n) }, "kicking off suites");
    //run suites => results of .expect of all steps of all suites
    return Promise.reduce(suites, (results, suite, ix, len) =>
      //run suite => results of .expect of all steps
      Promise.reduce(suite.steps, (results, step, ix, len) =>
        //run step = run all directives, collect step.results
        Promise.each(step.directives, d => d())
        .then(() => results.concat(step.results)),
        results
      ),
      []
    )
  }
}

function loadSuites(ioc) {
  const {
    config: {
      suites: suitesConfig,
      run: loadSuiteNames = Object.keys(suitesConfig),
    },
    client,
    directives,
    logger,
    log = logger.of("loader")
   } = ioc

  return loadSuiteNames.map(suiteName => {
    log.debug({suiteName}, 'loading suite: %s', suiteName)

    const suite = suitesConfig[suiteName]
    suite.steps = Object.keys(suite).map(stepName => {
      log.debug({suiteName, stepName}, 'loading step: %s/%s', suiteName, stepName)

      const step = suite[stepName]
      step.directives = Object.keys(step).map(directive => {
        log.debug({suiteName, stepName, directive}, 'loading directive: %s/%s/%s', suiteName, stepName, directive)
        const directiveFactory = directives[directive];

        if ('function' != typeof directiveFactory) throw newUnsupportedDirectiveError({suiteName, stepName, directive});

        return directiveFactory({log, suite, suiteName, stepName, step, directive, config: step[directive], client})
      })
      step.suiteName = suiteName
      step.name = stepName
      return step
    })
    suite.name = suiteName

    return suite
  })

  function newUnsupportedDirectiveError(meta) {
    return Object.assign(new Error(
      [
        "Unsupported directive",
        "Supported directives:",
        " " + Object.keys(directives).join(', ')
      ].join("\n"),
      meta
    ))
  }
}

