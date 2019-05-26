/*!
 * Sketchable | v2.2 | Luis A. Leiva | MIT license
 * A plugin for the jSketch drawing library.
 */

// XXX: Requires `sketchable.utils.js` to be loaded first.

/* eslint-env browser */
/* global Event, dataBind, deepExtend */
;(function(window) {

  // Custom namespace ID, for private data bindind.
  var namespace = 'sketchable';
  // Convenient shortcut.
  var document = window.document;

  /**
   * Initialize the plugin: make CANVAS elements drawable.<br>
   * Contrary to the jQuery version, only one element can be passed in at a time.
   * @param {object|string} elem - DOM element or selector.
   * @param {object} [options] - Configuration (default: {@link Sketchable#defaults}).
   * @class
   * @global
   * @version 2.2
   * @author Luis A. Leiva
   * @license MIT
   * @example
   * // Passing a DOM element:
   * var sketcher1 = new Sketchable(document.getElementById('foo'));
   * // Passing a selector:
   * var sketcher2 = new Sketchable('#foo');
   * // With custom configuration:
   * var sketcher2 = new Sketchable('#foo', { multitouch:false });
   * @see Sketchable#defaults
   */
  function Sketchable(elem, options) {
    if (!elem) throw new Error('Sketchable requires a DOM element.');
    if (typeof elem === 'string') elem = document.querySelector(elem);
    // Save a pointer to the DOM element to emulate jQuery capability.
    this.elem = elem;
    // Instance methods are chainable.
    return this.init(options);
  };

  /**
   * Sketchable prototype.
   * @ignore
   */
  Sketchable.prototype = {
    /**
     * Initialize the selected CANVAS elements.
     * @param {object} [opts] - Configuration (default: {@link Sketchable#defaults}).
     * @return {Sketchable}
     * @memberof Sketchable
     * @protected
     * @ignore
     */
    init: function(opts) {
      // Options will be available for all plugin methods.
      var options = deepExtend({}, Sketchable.prototype.defaults, opts || {});
      var elem = this.elem, data = dataBind(elem)[namespace];
      // Check if element is not initialized yet.
      if (!data) {
        // Attach event listeners.
        Event.add(elem, 'mousedown', mousedownHandler);
        Event.add(elem, 'mousemove', mousemoveHandler);
        Event.add(elem, 'mouseup', mouseupHandler);
        Event.add(elem, 'touchstart', touchdownHandler);
        Event.add(elem, 'touchmove', touchmoveHandler);
        Event.add(elem, 'touchend', touchupHandler);

        postProcess(elem, options);
      }

      var sketch = new jSketch(elem, options.graphics); // eslint-disable-line new-cap
      // Reconfigure element data.
      dataBind(elem)[namespace] = data = {
        // All strokes will be stored here.
        strokes: [],
        // This will store one stroke per touching finger.
        coords: {},
        // Date of first coord, used as time origin.
        // Will be initialized on drawing the first stroke.
        timestamp: 0,
        // Save a pointer to the drawing canvas (jSketch instance).
        sketch: sketch,
        // Save also a pointer to the Sketchable instance.
        // In the jQuery version this is not needed,
        // since we access the instance via `$('selector').sketchable('method')`.
        instance: this,
        // Save also a pointer to the given options.
        options: options,
      };

      // Trigger init event.
      if (typeof options.events.init === 'function')
        options.events.init(elem, data);
      // Initialize plugins.
      for (var name in this.plugins)
        this.plugins[name](this);
      // Make methods chainable.
      return this;
    },
    /**
     * Change configuration of an existing Sketchable instance.
     * @param {object} [opts] - Configuration (default: {@link Sketchable#defaults}).
     * @return {Sketchable}
     * @memberof Sketchable
     * @example
     * var sketcher = new Sketchable('#my-canvas', { interactive: false });
     * // Update later on:
     * sketcher.config({ interactive: true });
     */
    config: function(opts) {
      var elem = this.elem, data = dataBind(elem)[namespace];

      if (opts) { // setter
        data.options = deepExtend({}, Sketchable.prototype.defaults, data.options, opts);
        postProcess(elem);
        return this;
      } else { // getter
        return data;
      }
    },
    /**
     * Get/Set drawing data strokes sequence.
     * @param {array} [arr] - Multidimensional array of [x,y,time,status] tuples; status = 0 (pen down) or 1 (pen up).
     * @return {array|Sketchable} Strokes object on get, Sketchable instance on set (with the new data attached).
     * @memberof Sketchable
     * @example
     * var sketcher = new Sketchable('#my-canvas');
     * // Getter: read associated strokes.
     * var strokes = sketcher.strokes();
     * // Setter: replace associated strokes.
     * sketcher.strokes([ [arr1], ..., [arrN] ]);
     */
    strokes: function(arr) {
      var elem = this.elem, data = dataBind(elem)[namespace];

      if (arr) { // setter
        data.strokes = arr;
        return this;
      } else { // getter
        return data.strokes;
      }
    },
    /**
     * Allows low-level manipulation of the sketchable canvas.
     * @param {function} callback - Callback function, invoked with 2 arguments: elem (CANVAS element) and data (private element data).
     * @return {Sketchable}
     * @memberof Sketchable
     * @example
     * var sketcher = new Sketchable('#my-canvas');
     * sketcher.handler(function(elem, data) {
     *   // do something with elem or data
     * });
     */
    handler: function(callback) {
      var elem = this.elem, data = dataBind(elem)[namespace];

      callback(elem, data);

      return this;
    },
    /**
     * Clears canvas <b>together with</b> associated strokes data.
     * @see Sketchable.handler
     * @return {Sketchable}
     * @memberof Sketchable
     * @example
     * var sketcher = new Sketchable('#my-canvas');
     * // Warning: This will remove strokes data as well.
     * sketcher.clear();
     * // If you only need to clear the canvas, just do:
     * sketcher.handler(function(elem, data) {
     *   data.sketch.clear();
     * });
     */
    clear: function() {
      var elem = this.elem, data = dataBind(elem)[namespace], options = data.options;

      data.sketch.clear();
      data.strokes = [];
      data.coords  = {};

      if (typeof options.events.clear === 'function')
        options.events.clear(elem, data);

      return this;
    },
    /**
     * Reinitializes a sketchable canvas with given configuration options.
     * @param {object} [opts] - Configuration (default: {@link Sketchable#defaults}).
     * @return {Sketchable}
     * @memberof Sketchable
     * @example
     * var sketcher = new Sketchable('#my-canvas');
     * // Reset default state.
     * sketcher.reset();
     * // Reset with custom configuration.
     * sketcher.reset({ interactive:false });
     */
    reset: function(opts) {
      var elem = this.elem, data = dataBind(elem)[namespace], options = data.options;

      this.destroy().init(opts);

      if (typeof options.events.reset === 'function')
        options.events.reset(elem, data);

      return this;
    },
    /**
     * Destroys sketchable canvas, together with strokes data and associated events.
     * @return {Sketchable}
     * @memberof Sketchable
     * @example
     * var sketcher = new Sketchable('#my-canvas');
     * // This will leave the canvas element intact.
     * sketcher.destroy();
     */
    destroy: function() {
      var elem = this.elem, data = dataBind(elem)[namespace], options = data.options;

      Event.remove(elem, 'mouseup', mouseupHandler);
      Event.remove(elem, 'mousemove', mousemoveHandler);
      Event.remove(elem, 'mousedown', mousedownHandler);
      Event.remove(elem, 'touchstart', touchdownHandler);
      Event.remove(elem, 'touchmove', touchmoveHandler);
      Event.remove(elem, 'touchend', touchupHandler);

      dataBind(elem)[namespace] = null;

      if (typeof options.events.destroy === 'function')
        options.events.destroy(elem, data);

      return this;
    },
    /**
     * Decorate event. Will execute default event first.
     * @param {string} evName - Event name.
     * @param {function} listener - Custom event listener.
     * @param {string} initiator - Some identifier.
     * @return {Sketchable}
     * @memberof Sketchable
     * @example
     * var sketcher = new Sketchable('#my-canvas');
     * // Decorate 'clear' method with `myClearFn()`,
     * // using 'someId' to avoid collisions with other decorators.
     * sketcher.decorate('clear', myClearFn, 'someId');
     */
    decorate: function(evName, listener, initiator) {
      var elem = this.elem, data = dataBind(elem)[namespace], options = data.options;
      // Flag event override so that it doesn't get fired more than once.
      var overrideId = '_bound$'+ evName + '.' + initiator;
      if (data[overrideId]) return;
      data[overrideId] = true;

      if (options.events && typeof options.events[evName] === 'function') {
        // User has defined this event, so wrap it.
        var fn = options.events[evName];
        options.events[evName] = function() {
          // Exec original function first, then exec our listener.
          fn.apply(this, arguments);
          listener.apply(this, arguments);
        };
      } else {
        // User has not defined this event, so attach our listener.
        options.events[evName] = listener;
      }

      return this;
    },
  };

  /**
   * Plugins store.
   * @namespace Sketchable.prototype.plugins
   * @type {object}
   * @static
   * @example
   * // Note: All plugins are created after instance initialization.
   * Sketchable.prototype.plugins['your-awesome-plugin'] = function(instance) {
   *   // Do something with the Sketchable instance.
   * }
   */
  Sketchable.prototype.plugins = {};

  /**
   * Default configuration.
   * Note that `events.mouse*` callbacks are triggered only if <tt>interactive</tt> is set to <tt>true</tt>.
   * @namespace Sketchable.prototype.defaults
   * @type {object}
   * @static
   * @example
   * // The following is the default configuration:
   * new Sketchable('#canvasId', {
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
   * };
   */
  Sketchable.prototype.defaults = {
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
   * @ignore
   */
  function offset(el) {
    var box     = el.getBoundingClientRect();
    var body    = document.body;
    var docElem = document.documentElement;
    var scrollTop  = window.pageYOffset || docElem.scrollTop  || body.scrollTop;
    var scrollLeft = window.pageXOffset || docElem.scrollLeft || body.scrollLeft;
    var clientTop  = docElem.clientTop  || body.clientTop  || 0;
    var clientLeft = docElem.clientLeft || body.clientLeft || 0;
    var top  = box.top  + scrollTop  - clientTop;
    var left = box.left + scrollLeft - clientLeft;
    return {
      top: Math.round(top),
      left: Math.round(left),
    };
  };

  /**
   * @ignore
   */
  function postProcess(elem, options) {
    if (!options) options = dataBind(elem)[namespace].options;
    if (options.cssCursors) {
      // Visually indicate whether this element is interactive or not.
      elem.style.cursor = options.interactive ? 'pointer' : 'not-allowed';
    }
    // Fix unwanted highlight "bug".
    elem.onselectstart = function() {
      return false;
    };
  };

  /**
   * @ignore
   */
  function getMousePos(e) {
    var elem = e.target, pos = offset(elem);
    return {
      x: Math.round(e.pageX - pos.left),
      y: Math.round(e.pageY - pos.top),
      time: Date.now(),
    };
  };

  /**
   * @ignore
   */
  function saveMousePos(idx, data, pt) {
    // Current coords are already initialized.
    var coords = data.coords[idx];

    if (data.options.relTimestamps) {
      // The first timestamp is relative to initialization time;
      // thus fix it so that it is relative to the timestamp of the first stroke.
      if (data.strokes.length === 0 && coords.length === 0) data.timestamp = pt.time;
      pt.time -= data.timestamp;
    }

    coords.push([pt.x, pt.y, pt.time, +data.sketch.isDrawing, idx]);

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
   * @ignore
   */
  function mousedownHandler(e) {
    if (e.touches) return false;
    downHandler(e);
  };

  /**
   * @ignore
   */
  function mousemoveHandler(e) {
    if (e.touches) return false;
    moveHandler(e);
  };

  /**
   * @ignore
   */
  function mouseupHandler(e) {
    if (e.touches) return false;
    upHandler(e);
  };

  /**
   * @ignore
   */
  function touchdownHandler(e) {
    execTouchEvent(e, downHandler);
    e.preventDefault();
  };

  /**
   * @ignore
   */
  function touchmoveHandler(e) {
    execTouchEvent(e, moveHandler);
    e.preventDefault();
  };

  /**
   * @ignore
   */
  function touchupHandler(e) {
    execTouchEvent(e, upHandler);
    e.preventDefault();
  };

  /**
   * @ignore
   */
  function downHandler(e) {
    // Don't handle right clicks.
    if (Event.isRightClick(e)) return false;

    var idx   = Math.abs(e.identifier || 0),
      elem    = e.target,
      data    = dataBind(elem)[namespace],
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
   * @ignore
   */
  function moveHandler(e) {
    var idx   = Math.abs(e.identifier || 0),
      elem    = e.target,
      data    = dataBind(elem)[namespace],
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
   * @ignore
   */
  function upHandler(e) {
    var idx   = Math.abs(e.identifier || 0),
      elem    = e.target,
      data    = dataBind(elem)[namespace],
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
   * @ignore
   */
  function execTouchEvent(e, callback) {
    var elem  = e.target,
      data    = dataBind(elem)[namespace],
      options = data.options;

    if (options.multitouch) {
      // Track all fingers.
      var touches = e.changedTouches;
      for (var i = 0; i < touches.length; i++) {
        var touch = touches[i];
        callback(touch);
      }
    } else {
      // Track only the current finger.
      var touch = e.touches[0];
      callback(touch);
    }
    e.preventDefault();
  };

  // Expose.
  window.Sketchable = Sketchable;

})(this);
