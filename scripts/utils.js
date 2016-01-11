
const Promise = require('bluebird')

const fs = Promise.promisifyAll(require('fs-extra'))

function handleError (err) { log(err.stack || err.message || err) }

function log (message) { console.log(message) }

function mkdirs (dirname) {
  return fs.mkdirsAsync(dirname).then(function () {
    log(`Created ${dirname} directory`)
  })
}

module.exports = {
  handleError,
  log,
  mkdirs
}
