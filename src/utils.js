
import * as _ from 'lodash'

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

export default {
  findDropdownView
}
