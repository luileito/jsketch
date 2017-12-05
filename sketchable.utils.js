/* eslint-env browser */

(function() {
  var cache = [0], expando = 'data' + Date.now();
  function data(elem) {
    var cacheIndex     = elem[expando],
      nextCacheIndex = cache.length;
    if (!cacheIndex) {
      cacheIndex = elem[expando] = nextCacheIndex;
      cache[cacheIndex] = {};
    }
    return cache[cacheIndex];
  };
  /**
   * Add/Read private data to a DOM element.
   * @global
   * @method
   * @param {object} elem - DOM element to bind data to.
   * @return {void}
   * @example
   * var elem = document.getElementById('foo');
   * // Attach private data to element:
   * dataBind(elem).someName = { value: 42 };
   * dataBind(elem)['other-name'] = { value: 43 };
   * // Read private data from element:
   * var some = dataBind(elem).someName;
   * var other = dataBind(elem)['other-name'];
   */
  window.dataBind = data;
})();

/**
 * Event manager.
 * @global
 * @module Event
 */
window.Event = {
  /**
   * Add event to DOM element.
   * @memberof module:Event
   * @param {object|string} elem - DOM element or selector.
   * @param {string} type - Event type.
   * @param {function} fn - Callback.
   * @return {void}
   * @example
   * Event.add(document.getElementById('foo'), 'click', function fooClick(evt) {
   *   // Element was clicked.
   * });
   * Event.add('#foo', 'click', function fooClick(evt) {
   *   // Element was clicked.
   * });
   */
  add: function(elem, type, fn) {
    if (!elem) return false;
    if (typeof elem === 'string') elem = document.querySelector(elem);
    if (elem.addEventListener) { // W3C standard
      elem.addEventListener(type, fn, false);
    } else if (elem.attachEvent) { // Old IE versions
      elem.attachEvent('on'+type, fn);
    } else { // Really old browser
      elem[type+fn] = function() {
        fn(window.event);
      };
    }
  },
  /**
   * Remove event from DOM element.
   * @memberof module:Event
   * @param {object|string} elem - DOM element or selector.
   * @param {string} type - Event type.
   * @param {function} fn - Callback.
   * @return {void}
   * @example
   * // Assuming elemen had the `fooClick` function (see previous example):
   * Event.remove(document.getElementById('foo'), 'click', fooClick);
   * Event.remove('#foo'), 'click', fooClick);
   */
  remove: function(elem, type, fn) {
    if (!elem) return false;
    if (typeof elem === 'string') elem = document.querySelector(elem);
    if (elem.removeEventListener) { // W3C standard
      elem.removeEventListener(type, fn, false);
    } else if (elem.detachEvent) { // Old IE versions
      elem.detachEvent('on'+type, fn);
    } else { // Really old browser
      elem[type+fn] = null;
    }
  },
  /**
   * Determine if an event is a "right click" event.
   * @memberof module:Event
   * @param {object} ev - DOM event.
   * @return {boolean}
   * @example
   * // Assume this function is a click event listener.
   * function clickHandler(evt) {
   *   alert(Event.isRightClick(evt));
   * });
   */
  isRightClick: function(ev) {
    if (!ev) ev = window.event;
    if (ev.which) return ev.which === 3;
    else if (ev.button) return e.button === 2;
    return false;
  },

};

/**
 * A handy method to (deep) extend an object.
 * The input object is modified.
 * @global
 * @param {object} myObj - Input object.
 * @return {object}
 * @example
 * var one = { foo:1, bar: { a:true, b:false } };
 * var two = { bar: { a:false } };
 * // In this case both `ext` and `one` will be the same object.
 * var ext = deepExtend(one, two);
 * // To create a fresh copy, pass in an empty object as first arg.
 * var ext = deepExtend({}, one, two);
 * // Now `ext` is `{ foo:1, bar: { a:false, b:false } }`
 * // and `one` is left intact.
 */
window.deepExtend = function(myObj) {
  myObj = myObj || {};
  for (var i = 1; i < arguments.length; i++) {
    var obj = arguments[i];
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (typeof obj[key] === 'object') {
          myObj[key] = deepExtend(myObj[key], obj[key]);
        } else {
          myObj[key] = obj[key];
        }
      }
    }
  }
  return myObj;
};
