
const _ = require('lodash')

const rollup = require('rollup')
const babel = require('rollup-plugin-babel')

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
      external: _.keys(globals),
      plugins: [
        babel()
      ]
    }))
    .then((bundle) => bundle.generate({
      format: 'umd',
      moduleName: 'form',
      sourceMap: true,
      sourceMapFile: TARGET,
      globals
    }))
    .then((result) => {
      return Promise.all([
        fs.writeFileAsync(TARGET, result.code),
        fs.writeFileAsync(`${TARGET}.map`, result.map)
      ])
    })
    .then(() => utils.log(`Bundled application at 'src/index.js'`))
}

module.exports = build

if (!module.parent) {
  build().catch(utils.handleError)
}
