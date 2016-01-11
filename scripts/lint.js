
const eslint = require('eslint')

const Promise = require('bluebird')

const utils = require('./utils')

const TARGET = ['src/**/*.js']

function lint () {
  return Promise.resolve()
    .then(function () {
      var cli = new eslint.CLIEngine({useEslintrc: true})
      var formatter = cli.getFormatter('stylish')
      return Promise.resolve()
        .then(() => cli.executeOnFiles(TARGET))
        .then(function (report) {
          var result = formatter(report.results)
          if (result.length > 0) throw result
        })
    })
}

module.exports = lint

if (!module.parent) {
  lint().catch(utils.handleError)
}
