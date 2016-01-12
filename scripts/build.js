
const _ = require('lodash')

const rollup = require('rollup')

const Promise = require('bluebird')

const fs = Promise.promisifyAll(require('fs-extra'))

const lint = require('./lint')
const utils = require('./utils')

const GLOBALS = require('../package.json')['rollup-globals']
const TARGET = 'dist/js/marionette-form.js'

function build () {
  return Promise.resolve()
    .then(() => lint())
    .then(() => utils.mkdirs('dist'))
    .then(() => utils.mkdirs('dist/js'))
    .then(() => rollup.rollup({
      entry: 'src/index.js',
      external: _.keys(GLOBALS)
    }))
    .then((bundle) => bundle.generate({
      format: 'umd',
      moduleName: 'form',
      globals: GLOBALS
    }))
    .then((result) => fs.writeFileAsync(TARGET, result.code))
}

module.exports = build

if (!module.parent) {
  build().catch(utils.handleError)
}
