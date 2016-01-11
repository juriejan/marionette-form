
function log (message) { console.log(message) }

function handleError (err) { log(err.stack || err.message || err) }

module.exports = {
  log,
  handleError
}
