const builtIn = require('../checkers')
const getVal = require('lodash/get')

module.exports =  ({loadCustomHandler, logger}) => (directiveCtx) => {
  //TRICKY: the load also validate structure validity to fail fast
  const { step } = directiveCtx
  const claims = loadSuiteClaims(directiveCtx)

  return () => step.results = claims.map((claim) => {
    const found = claim.getValue(step.response)

    const result = {
      ...claim.ctx,
      found: 'undefined' == typeof found ? "<undefined>" : found,
      ...claim.check(found, { ...directiveCtx, expected: claim.ctx.expected })
    }

    logger.of("runner")[result.passed ? "debug" : "warn"](result, result.passed ? "claim approved" : "claim REJECTED")

    return result
  })

  function loadSuiteClaims({log, suiteName, stepName, directive = 'expect', step, config: expect}) {
    const claims = []

    Object.keys(expect).forEach(path => {
      let fieldCheckers = expect[path]
      if (!Array.isArray(fieldCheckers)) fieldCheckers = [fieldCheckers]

      fieldCheckers.forEach((checker, ix)  => {
        const meta = {
          suiteName, stepName, directive: "expect", path, checkNum: ix + 1,
        };
        log.debug(meta, 'loading path: %s/%s/%s/%s#%s', suiteName, stepName, directive, path, ix)

        const getValue = response => getVal(response, path)

        switch(typeof checker) {
          case "object": //checker is a map of built-in checkers
            Object.keys(checker).forEach(builtInCheckerName => {
              meta.checker = builtInCheckerName

              const check = builtIn[builtInCheckerName]
              if ('function' != typeof check) throw newNotExistingChecker(meta)

              const rawExpected = checker[builtInCheckerName]
              const expected = 'function' == typeof check.parseExpected
                ? //throws when parsing does not end with a valid number
                  check.parseExpected(rawExpected, meta)
                : rawExpected

              const ctx = { ...meta, expected }
              log.debug(ctx, 'adding a built-in checker: %s/%s/%s/%s#%s/%s',
                suiteName, stepName, directive, path, ix, builtInCheckerName, expected
              )

              claims.push({
                ctx,
                getValue,
                check,
              })
            })
            break

          case "string": //checker names custom function
            const ctx = { ...meta, checker }
            log.debug(ctx, 'loading a custom checker: %s/%s/%s/%s#ix/%s', suiteName, stepName, directive, path, ix, checker)

            const check = loadCustomHandler(checker, ctx)

            claims.push({
              ctx,
              step,
              getValue,
              check,
            })
            break

          default: //structure error
            throw newBadCheckerTypeError({
              ...meta,
              found: typeof checker,
              expected: "string | object", 
            })
        }
      })
    })

    return claims

    function newNotExistingChecker(meta) {
      return assign(
        new Error(
          [
            "Unsupported checker name for a built-in checker.",
            "When a checker is provided as an object - it's assumed to be a set of Build-in checkers",
            " - keys must be a built-in checcker or a supported alias to it",
            " - values are the expected value the found value should compare with",
            "Supported Checkers and Aliases: ",
            "  " + Object.keys(builtIn).join(", "),
          ].join("\n"),
          meta
        )
      )
    }

    function newBadCheckerTypeError(meta) {
      return assign(
        new Error(
          [
            "Invalid checker configuration. checkers may be one of:",
            " - object with keys of built-in checkers mapped to the expected values the check should meet",
            " - strings indicating name of suite-helper method to be invoked",
          ].join("\n"),
          meta
        )
      )
    }
  }
}