/* global CustomEvent */

// Custom event support for IE
CustomEvent = function (event, parameters) {
  const params = parameters || { bubbles: false, cancelable: false, detail: undefined };
  const evt = document.createEvent('CustomEvent');
  evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
  return evt;
};

CustomEvent.prototype = window.Event.prototype;
