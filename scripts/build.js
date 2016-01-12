
const _ = require('lodash')

const rollup = require('rollup')

const Promise = require('bluebird')

const fs = Promise.promisifyAll(require('fs-extra'))

const lint = require('./lint')
const utils = require('./utils')

const PACKAGE = require('../package.json')
const TARGET = PACKAGE['build-target']

function build () {
  // Retrieve the package globals
  var globals = PACKAGE['rollup-globals']
  // Follow the build steps
  return Promise.resolve()
    .then(() => lint())
    .then(() => utils.mkdirs('dist'))
    .then(() => utils.mkdirs('dist/js'))
    .then(() => rollup.rollup({
      entry: 'src/index.js',
      external: _.keys(globals)
    }))
    .then((bundle) => bundle.generate({
      format: 'umd',
      moduleName: 'form',
      globals
    }))
    .then((result) => fs.writeFileAsync(TARGET, result.code))
}

module.exports = build

if (!module.parent) {
  build().catch(utils.handleError)
}
