(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('lodash'), require('jquery'), require('marionette'), require('validator')) :
  typeof define === 'function' && define.amd ? define(['lodash', 'jquery', 'marionette', 'validator'], factory) :
  (global.form = factory(global._,global.$,global.Marionette,global.validator));
}(this, function (_,$,Marionette,Validator) { 'use strict';

  _ = 'default' in _ ? _['default'] : _;
  $ = 'default' in $ ? $['default'] : $;
  Marionette = 'default' in Marionette ? Marionette['default'] : Marionette;
  Validator = 'default' in Validator ? Validator['default'] : Validator;

  function findDropdownViewInRegions (view, name) {
    var result = null
    // Search regions if they are available
    if (view.getRegions) {
      _.each(view.getRegions(), function (region) {
        if (region.currentView) {
          if (region.currentView.name === name) {
            result = region.currentView
            return false
          }
        }
      })
    }
    // Return the result
    return result
  }

  function findDropdownView (view, name) {
    // Look in the current view
    var result = findDropdownViewInRegions(view, name)
    // Look in nested views
    if (!result) {
      _.each(view.getRegions(), function (region) {
        if (region.currentView) {
          result = findDropdownViewInRegions(region.currentView, name)
          if (result) { return false }
        }
      })
    }
    // Return the result
    return result
  }

  var utils = {
    findDropdownView
  }

  var FormBehavior = Marionette.Behavior.extend({
    ui: {
      selects: 'select'
    },
    events: {
      'submit': 'onSubmit',
      'input': 'onInput',
      'change': 'onChange'
    },
    initialize: function () {
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
        if (value) { el.val(value).trigger('change') }
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
      // Validate the form according to the field
      var rule = this.view.validation[name]
      if (rule && this.attemptedSubmission) {
        this.validate()
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
      this.attemptedSubmission = true
      this.validate(function (err, data) {
        // TODO: Handle error from validator
        if (err) { console.log(err); return }
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
        $el.val('').trigger('change')
      })
      this.suppressStates = false
      this.applyFormStates()
    },
    clearErrors: function () {
      this.view.$el.find('.form-group').removeClass('form-error')
    },
    fieldError: function (error, name) {
      // TODO: Better error handling
      if (error) console.log(error)
      var el = this.view.$el.find('[name=' + name + ']')
      el.closest('.form-group').addClass('form-error')
    },
    validate: function (done) {
      var formData = this.$el.serializeJSON()
      var validation = this.view.validation || {}
      // Filter validators and form data using the current form state
      var state = this.currentState
      formData = _.pick(formData, function (v, k) { return state[k] })
      validation = _.pick(validation, function (v, k) { return state[k] })
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
          this.$el.find('.form-group').each(function () {
            var el = $(this)
            if (el.hasClass('form-error')) {
              el.find('input').focus()
              return false
            }
          })
        }
      }.bind(this))
    },
    alterStateByField: function (display, field) {
      var el = this.view.$el.find('[name=' + field + ']')
      var group = el.closest('.form-group')
      var parent = el.parent()
      if (parent.hasClass('dropdown')) {
        var view = utils.findDropdownView(this.view, field)
        if (_.isArray(display)) {
          group.toggle(true)
          if (view) { view.setVisibleOptions(display) }
        } else {
          group.toggle(!!display)
          if (display && view) { view.refresh() }
        }
      } else if (el.is('select')) {
        if (_.isObject(display)) {
          _.each(display, function (v, k) {
            el.find('[value=' + k + ']').toggle(v)
          })
        } else {
          group.toggle(!!display)
          el.find('option').toggle(!!display)
        }
      } else {
        group.toggle(!!display)
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
      // Exclude indicated fields
      var exclude = this.view.exclude || {}
      _.each(exclude, function (o) { state[o] = false })
      // Store the complete state
      this.currentState = state
    }
  })

  var index = {
    FormBehavior
  }

  return index;

}));