/* global mocha, describe, it */

import form from 'form'
import {expect} from 'chai'

import * as Marionette from 'marionette'

var SampleView = Marionette.View.extend({
  behavior: {
    Form: {behaviorClass: form.FormBehavior}
  }
})

describe('Marionette Form', function () {
  it('works', function () {
    var view = new SampleView()
    expect(view).to.exists
  })
})

mocha.run()
