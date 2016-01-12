/* global mocha */

var MOCHA_EVENTS = [
  'start',
  'test',
  'test end',
  'suite',
  'suite end',
  'fail',
  'pass',
  'pending',
  'end'
]

var reporter = function (runner) {
  MOCHA_EVENTS.forEach(function (eventName) {
    runner.on(eventName, function () {
      console.log('report', eventName, arguments)
    })
  })
}

mocha.setup({ui: 'bdd', reporter})
