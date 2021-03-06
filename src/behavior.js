
import _ from 'lodash'
import $ from 'jquery'

import Marionette from 'marionette'
import Validator from 'validator'

import utils from './utils'

export default Marionette.Behavior.extend({
  ui: {
    selects: 'select'
  },
  events: {
    'submit': 'onSubmit',
    'input': 'onInput',
    'change': 'onChange'
  },
  initialize: function () {
    this.errorClass = this.options.errorClass || 'error'
    this.fieldSelector = this.options.fieldSelector || '.field'
    this.suppressStates = false
    this.listenTo(this.view, 'clear', this.clear)
  },
  onShow: function () {
    var data = this.view.serializeData()
    // Add dropdown icons for select controls
    this.ui.selects.after('<i class="icon-dropdown" />')
    // Populate the form with data
    this.suppressStates = true
    this.view.$el.find('input, select').each(function (i, el) {
      var $el = $(el)
      var value = data[$el.attr('name')]
      if (value) { $el.val(value).trigger('change') }
    })
    this.suppressStates = false
    this.applyFormStates()
  },
  onChange: function (e) {
    var el = $(e.target)
    var name = el.attr('name')
    // Refresh the form state according to the field
    var state = this.view.states[name]
    if (state && !this.suppressStates) {
      this.applyFormStates()
    }
  },
  onInput: function (e) {
    var el = $(e.target)
    var name = el.attr('name')
    // Validate the form according to the field
    var rule = this.view.validation[name]
    if (rule && this.attemptedSubmission) {
      this.validate()
    }
  },
  onSubmit: function (e) {
    e.preventDefault()
    this.view.trigger('attempt')
    this.attemptedSubmission = true
    this.validate(function (err, data) {
      // TODO: Handle error from validator
      if (err) { console.log(err); return }
      // Exclude indicated fields
      var exclude = this.view.exclude || {}
      data = _.omit(data, exclude)
      if (this.view.model) { this.view.model.set(data) }
      this.attemptedSubmission = false
      this.view.trigger('submit', data)
    }.bind(this))
  },
  clear: function () {
    this.attemptedSubmission = false
    this.suppressStates = true
    this.view.$el.find('input').each(function (i, el) {
      var $el = $(el)
      $el.val('').trigger('input').trigger('change')
    })
    this.suppressStates = false
    this.applyFormStates()
  },
  clearErrors: function () {
    var fields = this.view.$el.find(this.fieldSelector)
    fields.removeClass(this.errorClass)
    fields.find('.' + this.errorClass).remove()
  },
  fieldError: function (error, name) {
    var el = this.view.$el.find(`[name=${name}]`)
    var field = el.closest(this.fieldSelector)
    field.addClass(this.errorClass)
    this.view.trigger('error', field, error)
  },
  validate: function (done) {
    var formData = this.$el.serializeJSON()
    var validation = this.view.validation || {}
    // Filter validators and form data using the current form state
    var state = this.currentState
    formData = _.pickBy(formData, function (v, k) { return state[k] })
    validation = _.pickBy(validation, function (v, k) { return state[k] })
    // Validate the form data
    var validator = Validator.Validator(validation)
    validator.validate(formData, function (err, result) {
      if (err) { return done(err) }
      this.clearErrors()
      if (_.size(result) === 0) {
        if (done) { return done(null, formData) }
      } else {
        // Apply errors to fields
        _.each(result, _.bind(this.fieldError, this))
        // Focus on the first field with an error
        this.$el.find(this.fieldSelector).each(function () {
          var el = $(this)
          if (el.hasClass(this.errorClass)) {
            el.find('input').focus()
            return false
          }
        })
      }
    }.bind(this))
  },
  alterStateByField: function (display, field) {
    var el = this.view.$el.find('[name=' + field + ']')
    var group = el.closest(this.fieldSelector)
    var parent = el.parent()
    if (parent.hasClass('dropdown')) {
      var view = utils.findDropdownView(this.view, field)
      if (_.isArray(display)) {
        utils.display(group, true)
        if (view) { view.setVisibleOptions(display) }
      } else {
        utils.display(group, display)
      }
    } else if (el.is('select')) {
      if (_.isObject(display)) {
        _.each(display, function (v, k) {
          utils.display(el.find('[value=' + k + ']'), display)
        })
      } else {
        utils.display(group, display)
        utils.display(el.find('option'), display)
      }
    } else {
      utils.display(group, display)
    }
  },
  applyFormStates: function () {
    var modelData = this.view.serializeData()
    var formData = this.$el.serializeJSON()
    var data = _.extend(modelData, formData)
    var result = {}
    // Include all inputs in initial state
    this.$el.find('input').each(function (i, o) {
      if (o.name) { result[o.name] = true }
    })
    // Determine the current form state
    _.each(this.view.states, function (state, field) {
      if (result[field] !== false) {
        var value = data[field]
        if (value !== undefined) {
          _.each(state[value], function (v, k) {
            if (_.isBoolean(result[k]) && _.isBoolean(v)) {
              result[k] = result[k] && v
            } else if (_.isBoolean(result[k]) && _.isArray(v)) {
              result[k] = v
            } else if (_.isArray(result[k]) && _.isArray(v)) {
              result[k] = _.intersection(result[k], v)
            } else {
              result[k] = v
            }
          })
        }
      }
    })
    // Apply compiled state
    _.each(result, this.alterStateByField.bind(this))
    // Determine the complete state
    var state = _.clone(result)
    // Store the complete state
    this.currentState = state
  }
})
