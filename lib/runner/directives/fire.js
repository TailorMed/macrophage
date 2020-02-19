const { assign } = Object
const { isArray } = Array

module.exports = ({ Promise, loadCustomHandler }) => (directiveCtx) => {
  const getVal = require('lodash/get')
  const {
    suiteName, suite, stepName, step,
    log,
    client: apiClient,
    config: {
      client = "default", api, args,
      onResponse,
      mock
    }
  } = directiveCtx
  const ctx = {
    suiteName, stepName, directive: "fire", client, api,
  }

  const apiHandler =
    mock
    ? () => Promise.resolve(mock)
    : apiClient[client] && apiClient[client][api]
  if (!apiHandler) throw newMissingAPIError(ctx)

  //Throws on missing handler
  const onResponseHandler =
    onResponse 
    ? loadCustomHandler(onResponse, { ...ctx, hook: "onResponse", onResponse })
    : v => v.response

  log.debug(ctx, "step: %s/%s/fire", suiteName, stepName)

  const xArgEval = /\$\{([^\}]+)\}/

  return () => {
    const startTime = Date.now()

    return apiHandler(...evaluateArgs(isArray(args) ? args : [args]))
    .then(response => {
      response.responseTime = Date.now() - startTime

      log.info({ ...ctx, res: response }, "step: %s/%s/fire.onResponse:hook",
        suiteName, stepName, onResponse || "<without custom hook>"
      )

      const responseView = onResponseHandler({response, ...directiveCtx})

      return (
        responseView && responseView.then
        ? responseView
        : Promise.resolve(responseView || response)
      )
      .then(responseView => step.response = responseView)
    })
  }

  function newMissingAPIError(meta) {
    return assign(
      new Error([
        "no handler found for provided client and api",
      ].join("\n")),
      meta
    )
  }

  function evaluateArgs(args) {
    const muted = args.map(evaluateArg)

    log.debug({ ...ctx, args, muted }, "evaluated args")
    return muted

    function evaluateArg(arg) {
      switch(typeof arg) {
        case 'number': case 'boolean':
          return arg

        case 'string': {
          let evaluated = arg
          //TRICKY: we don't really care what the replace returns.
          // We're just using reg-ex the callback
          // it makes sure the extracted value is not converted to string
          // when not found - default to original value
          arg.replace(xArgEval, (_, path) => evaluated = getVal(suite, path))
          return evaluated
        }

        case 'object': {
          if (isArray(arg)) {
            return arg.map(evaluateArg)
          }

          const evaluated = {}
          Object.entries(arg).forEach(([argName, value]) => evaluated[argName] = evaluateArg(value))
          return evaluated
        }

        default:
          log.warn({ ...ctx, expected: 'string|number|boolean|object', found: typeof arg, argInspect: inspect(arg) }, "cannot evaluate unsupported arg type. ignoring parameter")
          return undefined
      }
    }
  }
}
