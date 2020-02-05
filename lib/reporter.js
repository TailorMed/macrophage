module.exports = ({logger}) => {
  const output = logger
  const log = logger.of("lib/reporter")

  log.debug("reporter constructed")

  return (results) => {
    const total = results.length
    const failed = results.filter(r => !r.passed).map(({suiteName, stepName, path, check, expected, found}) =>
      `${suiteName}/${stepName}/${path}: ${check}(${expected}), but got(${found})`
    )
    const passed = total - failed.length

    const suites = {};

    const section = (obj, name, def = {}) => obj[name] || (obj[name] = def)
    results.forEach(result => {
      const suite = section(suites, result.suiteName)
      const step = section(suite, result.stepName)
      const pathChecks = section(step,  result.path, [])

      const { path, checkNum, check, expected, found, passed } = result
      pathChecks.push(
        passed 
        ? { checkNum, check, expected, passed }
        : { checkNum, check, expected, passed , found }
      )
    })

    const report = {
      //results,
      event: "suites-summary",
      suites,
      failed,
      summary: {
        failed: failed.length,
        passed,
        total,
      },
      allPassed: !failed.length,
    };

    report.allPassed
    ? output.info(report, "all suite passed")
    : output.error(report, "one or more suites have failed")

    return report
  }
}