const ms = require('ms');
const msOf = found =>  new Date(found).getTime()
const checkers = {
  equals: (found, { expected }) => ({
    passed: found == expected,
    check: "equal to",
  }),
  lesserThanOrEqual: (found, { expected }) => ({
    passed: found <= expected,
    check: "lesser than or equal to",
  }),
  lesserThan: (found, { expected }) => ({
    passed: found < expected,
    check: "lesser than or equal to",
  }),
  greaterThanOrEqual: (found, { expected }) => ({
    passed: found >= expected,
    check: "greater than or equal to",
  }),
  greaterThan: (found, { expected }) => ({
    passed: found >= expected,
    check: "greater than",
  }),
  youngerThan: (found, { expected: ms }) => ({
    passed: Date.now() - msOf(found) <= ms,
    check: "date is younger than",
  }),
  olderThan: (found, { expected: ms }) => ({
    passed: Date.now() - msOf(found) >= ms,
    check: "date is younger than",
  }),
  isOfType: (found, { expected: type }) => {
    //1st level - primitive type (number, boolean, string, object, undefined)
    const expectedType = String(type).toLowerCase()
    let foundType = typeof found
    let passed = expectedType == foundType

    //2nd level - Class name (e.g. Date, Array)
    if (!passed) {
      foundType = found && found.constructor.name.toLowerCase()
      passed = expectedType == foundType
    }

    return {
      passed,
      check: "of type",
      found: foundType,
    }
  },
};

//numeric values that may be expressed as time-span strings (e.g. 1d, 4h)
[
  "greaterThan", "greaterThanOrEqual", "lesserThan", "lesserThanOrEqual", "youngerThan", "olderThan"
].forEach(
  numericCheckerName =>
    checkers[numericCheckerName].parseExpected = (v, meta) => {
      if ('number' == typeof v) return v
      let parsed = ms(v)

      if ('undefined' == typeof parsed) parsed = parseFloat(v)

      if (isNaN(parsed)) throw new Object.assign(new Error([
        'Found a string for a numerical checker but could not convert it to a number.',
        'Supported conversions:',
        ' - node package `ms`',
      ].join(','), {
        ...meta,
        value: v,
        type: typeof v,
        parsed: parsed
      }))

      return parsed
    }
)

//supported aliases
module.exports = Object.assign(checkers, {
  "=":      checkers.equals,
  "eq":     checkers.equals,
  "eql":    checkers.equals,
  ">":      checkers.greaterThan,
  "gt":     checkers.greaterThan,
  ">=":     checkers.greaterThanOrEqual,
  "gte":    checkers.greaterThanOrEqual,
  "<":      checkers.lesserThan,
  "lt":     checkers.lesserThan,
  "<=":     checkers.lesserThanOrEqual,
  "lte":    checkers.lesserThanOrEqual,
  "is":     checkers.isOfType,
  "type":   checkers.isOfType,
  "ofType": checkers.isOfType,
})
