/* global mocha, describe, it */

import form from 'form'
import {expect} from 'chai'

describe('Marionette Form', function () {
  it('works', function () {
    expect(form.FormBehavior).to.exists
  })
})

mocha.run()
