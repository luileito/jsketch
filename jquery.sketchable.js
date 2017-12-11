/*!
 * jQuery sketchable | v2.1 | Luis A. Leiva | MIT license
 * A jQuery plugin for the jSketch drawing library.
 */

/**
 * @method $
 * @description jQuery constructor. See {@link https://jquery.com}
 * @param {string} selector - jQuery selector.
 * @return {object} jQuery
 */
/**
 * @namespace $.fn
 * @description jQuery prototype. See {@link https://learn.jquery.com/plugins/}
 */

/* eslint-env browser */
/* global jQuery */
;(function($) {

  // Custom namespace ID, for private data bindind.
  var namespace = 'sketchable';

  // Begin jQuery Sketchable plugin API.
  var api = {
    /**
     * Initialize the selected jQuery objects.
     * @param {object} [opts] - Configuration (default: {@link $.fn.sketchable.defaults}).
     * @return jQuery
     * @memberof $.fn.sketchable
     * @ignore
     * @protected
     */
    init: function(opts) {
      var options = $.extend(true, {}, $.fn.sketchable.defaults, opts || {});

      return this.each(function() {
        var elem = $(this), data = elem.data(namespace);
        // Check if element is not initialized yet.
        if (!data) {
          // Attach event listeners.
          elem.bind('mousedown', mousedownHandler);
          elem.bind('mousemove', mousemoveHandler);
          elem.bind('mouseup', mouseupHandler);
          elem.bind('touchstart', touchdownHandler);
          elem.bind('touchmove', touchmoveHandler);
          elem.bind('touchend', touchupHandler);

          postProcess(elem, options);
        }

        var sketch = new jSketch(this, options.graphics); // eslint-disable-line new-cap
        // Reconfigure element data.
        elem.data(namespace, {
          // All strokes will be stored here.
          strokes: [],
          // This will store one stroke per touching finger.
          coords: {},
          // Date of first coord, used as time origin.
          timestamp: (new Date).getTime(),
          // Save a pointer to the drawing canvas (jSketch instance).
          sketch: sketch,
          // Save also a pointer to the given options.
          options: options,
        });

        // Trigger init event.
        if (typeof options.events.init === 'function')
          options.events.init(elem, elem.data(namespace));
        // Initialize plugins.
        for (var name in $.fn.sketchable.plugins)
          $.fn.sketchable.plugins[name](elem);
      });
    },
    /**
     * Change configuration of an existing jQuery Sketchable element.
     * @param {object} [opts] - Configuration (default: {@link $.fn.sketchable.defaults}).
     * @return jQuery
     * @memberof $.fn.sketchable
     * @example
     * var $canvas = $('canvas').sketchable('config', { interactive: false });
     * // Update later on:
     * $canvas.sketchable('config', { interactive: true });
     */
    config: function(opts) {
      if (opts) { // setter
        return this.each(function() {
          var elem = $(this), data = elem.data(namespace);
          data.options = $.extend(true, {}, $.fn.sketchable.defaults, data.options, opts);
          postProcess(elem);
        });
      } else { // getter
        return $(this).data(namespace);
      }
    },
    /**
     * Get/Set drawing data strokes sequence.
     * @param {array} [arr] - Multidimensional array of [x,y,time,status] tuples; status = 0 (pen down) or 1 (pen up).
     * @return Strokes object on get, jQuery instance on set (with the new data attached).
     * @memberof $.fn.sketchable
     * @example
     * // Getter: read associated strokes.
     * var strokes = $('canvas').sketchable('strokes');
     * // Setter: replace associated strokes.
     * $('canvas').sketchable('strokes', [ [arr1], ..., [arrN] ]);
     */
    strokes: function(arr) {
      if (arr) { // setter
        return this.each(function() {
          var elem = $(this), data = elem.data(namespace);
          data.strokes = arr;
        });
      } else { // getter
        var data = $(this).data(namespace);
        return data.strokes;
      }
    },
    /**
     * Allow low-level manipulation of the sketchable canvas.
     * @param {function} callback - Callback function, invoked with 2 arguments: elem (CANVAS element) and data (private element data).
     * @return jQuery
     * @memberof $.fn.sketchable
     * @example
     * $('canvas').sketchable('handler', function(elem, data) {
     *   // do something with elem or data
     * });
     */
    handler: function(callback) {
      return this.each(function() {
        var elem = $(this), data = elem.data(namespace);
        callback(elem, data);
      });
    },
    /**
     * Clears canvas <b>together with</b> associated strokes data.
     * @return jQuery
     * @memberof $.fn.sketchable
     * @see $.fn.sketchable.handler
     * @example
     * var $canvas = $('canvas').sketchable();
     * // This will remove strokes data as well.
     * $canvas.clear();
     * // If you only need to clear the canvas, just do:
     * $canvas.sketchable('handler', function(elem, data) {
     *   data.sketch.clear();
     * });
     */
    clear: function() {
      return this.each(function() {
        var elem = $(this), data = elem.data(namespace), options = data.options;
        if (data.sketch) {
          data.sketch.clear();
          data.strokes = [];
          data.coords  = {};
        }

        if (typeof options.events.clear === 'function')
          options.events.clear(elem, data);
      });
    },
    /**
     * Reinitialize a sketchable canvas with given configuration options.
     * @param {object} [opts] - Configuration (default: {@link $.fn.sketchable.defaults}).
     * @return jQuery
     * @memberof $.fn.sketchable
     * @example
     * var $canvas = $('canvas').sketchable();
     * // Reset default state.
     * $canvas.sketchable('reset');
     * // Reset with custom configuration.
     * $canvas.sketchable('reset', { interactive:false });
     */
    reset: function(opts) {
      return this.each(function() {
        var elem = $(this), data = elem.data(namespace), options = data.options;

        elem.sketchable('destroy').sketchable(opts);

        if (typeof options.events.reset === 'function')
          options.events.reset(elem, data);
      });
    },
    /**
     * Destroy sketchable canvas, together with strokes data and associated events.
     * @return jQuery
     * @memberof $.fn.sketchable
     * @example
     * var $canvas = $('canvas').sketchable();
     * // This will leave the canvas element intact.
     * $canvas.sketchable('destroy');
     */
    destroy: function() {
      return this.each(function() {
        var elem = $(this), data = elem.data(namespace), options = data.options;

        elem.unbind('mouseup', mouseupHandler);
        elem.unbind('mousemove', mousemoveHandler);
        elem.unbind('mousedown', mousedownHandler);
        elem.unbind('touchstart', touchdownHandler);
        elem.unbind('touchmove', touchmoveHandler);
        elem.unbind('touchend', touchupHandler);

        elem.removeData(namespace);

        if (options && typeof options.events.destroy === 'function')
          options.events.destroy(elem, data);
      });
    },
  };

  /**
   * Create a <tt>jQuery Sketchable</tt> instance.
   * This is a jQuery wrapper for the <tt>jSketch</tt> drawing class.
   * @namespace $.fn.sketchable
   * @param {string|object} method - Method to invoke, or a configuration object.
   * @return jQuery
   * @version 2.1
   * @author Luis A. Leiva
   * @license MIT license
   * @example
   * $('canvas').sketchable();
   * $('canvas').sketchable({ interactive:false });
   */
  $.fn.sketchable = function(method) {
    var args = Array.prototype.slice.call(arguments, 1);
    if (typeof method === 'object' || !method) {
      // Constructor.
      return api.init.apply(this, arguments);
    } else if (method.indexOf('.') > -1) {
      // Plugin method.
      var actualMethod = locate(api, method);
      return actualMethod.apply(this, args);
    } else if (api[method]) {
      // Instance method.
      return api[method].apply(this, args);
    } else {
      $.error('Unknown method: ' + method);
    }
    return this;
  };

  /**
   * Public API. Provides access to all methods of jQuery Sketchable instances.<br>
   * Note: This is equivalent to accessing `Sketchable.prototype` in the non-jQuery version.
   * @namespace $.fn.sketchable.api
   * @type {object}
   * @see Sketchable
   */
  $.fn.sketchable.api = api;

  /**
   * Plugins store.
   * @namespace $.fn.sketchable.plugins
   * @type {object}
   * @example
   * // All plugins are created after instance initialization:
   * $.fn.sketchable.plugins['your-awesome-plugin'] = function($instance) {
   *   // Do something with the jQuery Sketchable instance.
   * }
   */
  $.fn.sketchable.plugins = {};

  /**
   * Default configuration.
   * Note that `events.mouse*` callbacks are triggered only if <tt>interactive</tt> is set to <tt>true</tt>.
   * @namespace $.fn.sketchable.defaults
   * @type {object}
   * @example
   * // The following is the default configuration:
   * $('canvas').sketchable({
   *   interactive: true,
   *   mouseupMovements: false,
   *   relTimestamps: false,
   *   multitouch: true,
   *   cssCursors: true,
   *   filterCoords: false,
   *   // Event hooks.
   *   events: {
   *     init: function(elem, data) {
   *       // Called when the Sketchable instance is created.
   *     },
   *     destroy: function(elem, data) {
   *       // Called when the Sketchable instance is destroyed.
   *     },
   *     clear: function(elem, data) {
   *       // Called when the canvas is cleared.
   *       // This event includes clearing strokes data, too.
   *     },
   *     mousedown: function(elem, data, evt) {
   *       // Called when the user clicks or taps on the canvas.
   *     },
   *     mousemove: function(elem, data, evt) {
   *       // Called when the user moves the mouse or finger over the canvas.
   *     },
   *     mouseup: function(elem, data, evt) {
   *       // Called when the user lifts the mouse or finger off the canvas.
   *     },
   *   },
   *   // Drawing options, to be used in jSketch lib.
   *   graphics: {
   *     firstPointSize: 3,
   *     lineWidth: 3,
   *     strokeStyle: '#F0F',
   *     fillStyle: '#F0F',
   *     lineCap: 'round',
   *     lineJoin: 'round',
   *     miterLimit: 10
   *   }
   * });
   */
  $.fn.sketchable.defaults = {
    // In interactive mode, it's possible to draw via mouse/pen/touch input.
    interactive: true,
    // Indicate whether non-drawing strokes should be registered as well.
    // Notice that the last mouseUp stroke is never recorded, as the user has already finished drawing.
    mouseupMovements: false,
    // Indicate whether timestamps should be relative (start at time 0) or absolute (start at Unix epoch).
    relTimestamps: false,
    // Enable multitouch drawing.
    multitouch: true,
    // Display CSS cursors, mainly to indicate whether the element is interactive or not.
    cssCursors: true,
    // Remove duplicated consecutive points; e.g. `(1,2)(1,2)(5,5)(1,2)` becomes `(1,2)(5,5)(1,2)`.
    // This is useful for touchscreens, where the same event is registered more than once.
    filterCoords: false,
    // Event hooks.
    events: {
      // init: function(elem, data) { },
      // clear: function(elem, data) { },
      // destroy: function(elem, data) { },
      // mousedownBefore: function(elem, data, evt) { },
      // mousedown: function(elem, data, evt) { },
      // mousemoveBefore: function(elem, data, evt) { },
      // mousemove: function(elem, data, evt) { },
      // mouseupBefore: function(elem, data, evt) { },
      // mouseup: function(elem, data, evt) { },
    },
    // Drawing options, to be used in jSketch lib.
    graphics: {
      firstPointSize: 3,
      lineWidth: 3,
      strokeStyle: '#F0F',
      fillStyle: '#F0F',
      lineCap: 'round',
      lineJoin: 'round',
      miterLimit: 10,
    },
  };

  /**
   * @private
   */
  function postProcess(elem, options) {
    if (!options) options = elem.data(namespace).options;
    if (options.cssCursors) {
      // Visually indicate whether this element is interactive or not.
      elem[0].style.cursor = options.interactive ? 'pointer' : 'not-allowed';
    }
    // Fix unwanted highlight "bug". Note: `this` is the actual DOM element.
    this.onselectstart = function() {
      return false;
    };
  };

  /**
   * @private
   */
  function locate(obj, path) {
    path = path.split('.');
    for (var i = 0; i < path.length; i++) {
      var key = path[i];
      obj = obj[key];
    }
    return obj;
  }

  /**
   * @private
   */
  function getMousePos(e) {
    var elem = $(e.target), pos = elem.offset();
    return {
      x: Math.round(e.pageX - pos.left),
      y: Math.round(e.pageY - pos.top),
    };
  };

  /**
   * @private
   */
  function saveMousePos(idx, data, pt) {
    // Current coords are already initialized.
    var coords = data.coords[idx];

    var time = (new Date).getTime();
    if (data.options.relTimestamps) {
      // The first timestamp is relative to initialization time;
      // thus fix it so that it is relative to the timestamp of the first stroke.
      if (data.strokes.length === 0 && coords.length === 0) data.timestamp = time;
      time -= data.timestamp;
    }

    coords.push([pt.x, pt.y, time, +data.sketch.isDrawing]);

    // Check if consecutive points should be removed.
    if (data.options.filterCoords && coords.length > 1) {
      var lastIndex = coords.length - 1;
      var lastCoord = coords[lastIndex];
      var currCoord = coords[lastIndex - 1];
      if (lastCoord[0] == currCoord[0] && lastCoord[1] == currCoord[1]) {
        coords.splice(lastIndex, 1);
      }
    }
  };

  /**
   * @private
   */
  function mousedownHandler(e) {
    if (e.originalEvent.touches) return false;
    downHandler(e);
  };

  /**
   * @private
   */
  function mousemoveHandler(e) {
    if (e.originalEvent.touches) return false;
    moveHandler(e);
  };

  /**
   * @private
   */
  function mouseupHandler(e) {
    if (e.originalEvent.touches) return false;
    upHandler(e);
  };

  /**
   * @private
   */
  function touchdownHandler(e) {
    execTouchEvent(e, downHandler);
    e.preventDefault();
  };

  /**
   * @private
   */
  function touchmoveHandler(e) {
    execTouchEvent(e, moveHandler);
    e.preventDefault();
  };

  /**
   * @private
   */
  function touchupHandler(e) {
    execTouchEvent(e, upHandler);
    e.preventDefault();
  };

  /**
   * @private
   */
  function downHandler(e) {
    // Don't handle right clicks.
    if (e.which === 3) return false;

    var idx   = e.identifier || 0,
      elem    = $(e.target),
      data    = elem.data(namespace),
      options = data.options;
    // Exit early if interactivity is disabled.
    if (!options.interactive) return;

    var p = getMousePos(e);

    if (typeof options.events.mousedownBefore === 'function')
      options.events.mousedownBefore(elem, data, e);

    // Mark visually 1st point of stroke.
    if (options.graphics.firstPointSize > 0) {
      data.sketch
          .beginFill(options.graphics.fillStyle)
          .fillCircle(p.x, p.y, options.graphics.firstPointSize)
          .endFill();
    }

    data.sketch.isDrawing = true;
    data.sketch.beginPath();

    // Ensure that coords is properly initialized.
    var coords = data.coords[idx];
    if (!coords) coords = [];
    // Don't mix mouseup and mousedown in the same stroke.
    if (coords.length > 0) data.strokes.push(coords);
    // In any case, ensure that coords is  properly reset/initialized.
    data.coords[idx] = [];

    saveMousePos(idx, data, p);

    if (typeof options.events.mousedown === 'function')
      options.events.mousedown(elem, data, e);
  };

  /**
   * @private
   */
  function moveHandler(e) {
    var idx   = e.identifier || 0,
      elem    = $(e.target),
      data    = elem.data(namespace),
      options = data.options;
    // Exit early if interactivity is disabled.
    if (!options.interactive) return;
    // Grab penup strokes AFTER drawing something on the canvas for the first time.
    if ( (!options.mouseupMovements || data.strokes.length === 0) && !data.sketch.isDrawing ) return;

    var p = getMousePos(e);

    if (typeof options.events.mousemoveBefore === 'function')
      options.events.mousemoveBefore(elem, data, e);

    var coords = data.coords[idx];
    var last = coords[coords.length - 1];
    if (last) {
      var brush = data.sketch;
      if (data.sketch.isDrawing) {
        // Style for regular, pendown strokes.
        brush.lineStyle(options.graphics.strokeStyle, options.graphics.lineWidth);
      } else if (options.mouseupMovements.visible !== false) {
        // Style for penup strokes.
        brush.lineStyle(options.mouseupMovements.strokeStyle || '#DDD', options.mouseupMovements.lineWidth || 1);
      }
      brush.line(last[0], last[1], p.x, p.y).stroke();
    }

    saveMousePos(idx, data, p);

    if (typeof options.events.mousemove === 'function')
      options.events.mousemove(elem, data, e);
  };

  /**
   * @private
   */
  function upHandler(e) {
    var idx   = e.identifier || 0,
      elem    = $(e.target),
      data    = elem.data(namespace),
      options = data.options;
    // Exit early if interactivity is disabled.
    if (!options.interactive) return;

    if (typeof options.events.mouseupBefore === 'function')
      options.events.mouseupBefore(elem, data, e);

    data.sketch.isDrawing = false;
    data.sketch.closePath();

    data.strokes.push(data.coords[idx]);
    data.coords[idx] = [];

    if (typeof options.events.mouseup === 'function')
      options.events.mouseup(elem, data, e);
  };

  /**
   * @private
   */
  function execTouchEvent(e, callback) {
    var elem = $(e.target), data = elem.data(namespace), options = data.options;
    if (options.multitouch) {
      // Track all fingers.
      var touches = e.originalEvent.changedTouches;
      for (var i = 0; i < touches.length; i++) {
        var touch = touches[i];
        // Add event type and finger ID.
        touch.type = e.type;
        touch.identifier = i;
        callback(touch);
      }
    } else {
      // Track only the current finger.
      var touch = e.originalEvent.touches[0];
      touch.type = e.type;
      touch.identifier = 0;
      callback(touch);
    }
  };

})(jQuery);
