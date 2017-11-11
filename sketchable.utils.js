/**
 * Data binding lib.
 */
(function(){
  var cache   = [0],
      expando = 'data' + +(new Date);
  function data(elem) {
    var cacheIndex     = elem[expando],
        nextCacheIndex = cache.length;
    if (!cacheIndex) {
      cacheIndex = elem[expando] = nextCacheIndex;
      cache[cacheIndex] = {};
    }
    return cache[cacheIndex];
  };
  window.dataBind = data;
})();

/**
 * Event manager.
 */
var Event = {

  add: function(elem, type, fn) {
    if (!elem) return false;
    if (elem.addEventListener) { // W3C standard
      elem.addEventListener(type, fn, false);
    } else if (elem.attachEvent) { // IE versions
      elem.attachEvent("on"+type, fn);
    } else { // Really old browser
      elem[type+fn] = function(){ fn(window.event); };
    }
  },

  remove: function(elem, type, fn) {
    if (!elem) return false;
    if (elem.removeEventListener) { // W3C standard
      elem.removeEventListener(type, fn, false);
    } else if (elem.detachEvent) { // IE versions
      elem.detachEvent("on"+type, fn);
    } else { // Really old browser
      elem[type+fn] = null;
    }
  },

  isRightClick: function(ev) {
    if (!ev) ev = window.event;
    if (ev.which) return ev.which === 3;
    else if (ev.button) return e.button === 2;
    return false;
  }

};

/**
 * A handy method to (deep) extend an object.
 */
var deepExtend = function(myObj) {
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
