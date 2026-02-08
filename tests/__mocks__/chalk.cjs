/**
 * chalk mock for Jest CJS environment
 * chalk v5 is pure ESM and cannot be imported in CJS mode
 */
const identity = (str) => str;

const chalk = {
  blue: identity,
  green: identity,
  yellow: identity,
  red: identity,
  gray: identity,
  cyan: identity,
  magenta: identity,
  white: identity,
  bold: identity,
  dim: identity,
  italic: identity,
  underline: identity,
};

module.exports = chalk;
module.exports.default = chalk;
