/*!
 * Sketchable | v2.0 | Luis A. Leiva | MIT license
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
   * @param {Object|Strig} elem - DOM element or selector.
   * @param {Object} [options] - Configuration (default: {@link Sketchable#defaults}).
   * @class
   * @global
   * @version 1.9
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
   * @namespace Sketchable.prototype
   * @static
   */
  Sketchable.prototype = {
    /**
     * Initialize the selected CANVAS elements.
     * @param {Object} [options] - Configuration (default: {@link Sketchable#defaults}).
     * @return Sketchable
     * @memberof Sketchable
     * @protected
     * @ignore
     */
    init: function(options) {
      // Options will be available for all plugin methods.
      var options = deepExtend({}, Sketchable.prototype.defaults, options || {});
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
        // Fix unwanted highlight "bug".
        elem.onselectstart = function() { return false };

        if (options.cssCursors) {
          // Visually indicate whether this element is interactive or not.
          elem.style.cursor = options.interactive ? 'pointer' : 'not-allowed';
        }
      }

      var sketch = new jSketch(elem, options.graphics);
      // Reconfigure element data.
      dataBind(elem)[namespace] = data = {
        // All strokes will be stored here.
        strokes: [],
        // This will store one stroke per touching finger.
        coords: {},
        // Date of first coord, used as time origin.
        timestamp: (new Date).getTime(),
        // Save a pointer to the drawing canvas (jSketch instance).
        sketch: sketch,
        // Save a pointer to the drawing canvas (jSketch instance).
        sketchable: this,
        // Save also a pointer to the given options.
        options: options
      };

      // Trigger init event.
      if (typeof options.events.init === 'function') {
        options.events.init(elem, data);
      }
      // Initialize plugins.
      for (var name in this.plugins) {
        this.plugins[name](this);
      }
      // Make methods chainable.
      return this;
    },
    /**
     * Change configuration of an existing Sketchable instance.
     * @param {Object} [options] - Configuration (default: {@link Sketchable#defaults}).
     * @return Sketchable
     * @memberof Sketchable
     * @example
     * var sketcher = new Sketchable('canvas').config({ interactive: false });
     * // Update later on:
     * sketcher.config({ interactive: true });
     */
    config: function(options) {
      var elem = this.elem, data = dataBind(elem)[namespace];
      if (options) { // setter
        data.options = deepExtend({}, Sketchable.prototype.defaults, options || {});
        return this;
      } else { // getter
        return data;
      }
    },
    /**
     * Get/Set drawing data strokes sequence.
     * @param {Array} [arr] - Multidimensional array of [x,y,time,status] tuples; status = 0 (pen down) or 1 (pen up).
     * @return Strokes object on get, Sketchable instance on set (with the new data attached).
     * @memberof Sketchable
     * @example
     * // Getter: read associated strokes.
     * new Sketchable('canvas').strokes();
     * // Setter: replace associated strokes.
     * new Sketchable('canvas').strokes([ [arr1], ..., [arrN] ]);
     */
    strokes: function(arr) {
      var elem = this.elem;
      if (arr) { // setter
        var data = dataBind(elem)[namespace];
        data.strokes = arr;
        return this;
      } else { // getter
        var data = dataBind(elem)[namespace];
        return data.strokes;
      }
    },
    /**
     * Allows low-level manipulation of the sketchable canvas.
     * @param {Function} callback - Callback function, invoked with 2 arguments: elem (CANVAS element) and data (private element data).
     * @return Sketchable
     * @memberof Sketchable
     * @example
     * new Sketchable('canvas').handler(function(elem, data) {
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
     * @return Sketchable
     * @memberof Sketchable
     * @example
     * var sketcher = new Sketchable('canvas');
     * // This will remove strokes data as well.
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

      if (typeof options.events.clear === 'function') {
        options.events.clear(elem, data);
      }
      return this;
    },
    /**
     * Reinitializes a sketchable canvas with given configuration options.
     * @param {Object} [options] - Configuration (default: {@link Sketchable#defaults}).
     * @return Sketchable
     * @memberof Sketchable
     * @example
     * // Reset default state.
     * new Sketchable('canvas').reset();
     * // Reset with custom configuration.
     * new Sketchable('canvas').reset({ interactive:false });
     */
    reset: function(options) {
      var elem = this.elem, data = dataBind(elem)[namespace], options = data.options;

      this.destroy().init(options);

      if (typeof options.events.reset === 'function') {
        options.events.reset(elem, data);
      }
      return this;
    },
    /**
     * Destroys sketchable canvas, together with strokes data and associated events.
     * @return Sketchable
     * @memberof Sketchable
     * @example
     * // This will leave the canvas element intact.
     * new Sketchable('canvas').destroy();
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

      if (typeof options.events.destroy === 'function') {
        options.events.destroy(elem, data);
      }
      return this;
    }

  };

  /**
   * Plugins store.
   * @namespace Sketchable.prototype.plugins
   * @type {Object}
   * @static
   * @example
   * // All plugins are created after instance initialization:
   * Sketchable.prototype.plugins['your-awesome-plugin'] = function(instance) {
   *   // Do something with the Sketchable instance.
   * }
   */
  Sketchable.prototype.plugins = {};

  /**
   * Default configuration.
   * Note that `events.mouse*` callbacks are triggered only if <tt>interactive</tt> is set to <tt>true</tt>.
   * @namespace Sketchable.prototype.defaults
   * @type {Object}
   * @static
   * @example
   * // The following is the default configuration:
   * new Sketchable('canvas', {
   *   interactive: true,
   *   mouseupMovements: false,
   *   relTimestamps: false,
   *   multitouch: false,
   *   cssCursors: true,
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
  Sketchable.prototype.defaults = {
    // In interactive mode, it's possible to draw via mouse/pen/touch input.
    interactive: true,
    // Indicate whether non-drawing strokes should be registered as well.
    // Notice that the last mouseUp stroke is never recorded, as the user has already finished drawing.
    mouseupMovements: false,
    // Inidicate whether timestamps should be relative (start at time 0) or absolute (start at Unix epoch).
    relTimestamps: false,
    // Enable multitouch drawing.
    multitouch: true,
    // Display CSS cursors, mainly to indicate whether the element is interactive or not.
    cssCursors: true,
    // Event hooks.
    events: {
      // init: function(elem, data) { },
      // clear: function(elem, data) { },
      // destroy: function(elem, data) { },
      // mousedown: function(elem, data, evt) { },
      // mousemove: function(elem, data, evt) { },
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
      miterLimit: 10
    }
  };

  /**
   * @private
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
      top:  Math.round(top),
      left: Math.round(left)
    }
  };

  /**
   * @private
   */
  function getMousePos(e) {
    var elem = e.target, pos = offset(elem);
    return {
      x: Math.round(e.pageX - pos.left),
      y: Math.round(e.pageY - pos.top)
    }
  };

  /**
   * @private
   */
  function saveMousePos(idx, data, pt) {
    // Ensure that coords is properly initialized.
    if (!data.coords[idx]) {
      data.coords[idx] = [];
    }

    var time = (new Date).getTime();
    if (data.options.relTimestamps) {
      // The first timestamp is relative to initialization time;
      // thus fix it so that it is relative to the timestamp of the first stroke.
      if (data.strokes.length === 0 && data.coords[idx].length === 0) data.timestamp = time;
      time -= data.timestamp;
    }

    data.coords[idx].push([ pt.x, pt.y, time, +data.sketch.isDrawing ]);
  };

  /**
   * @private
   */
  function mousedownHandler(e) {
    if (e.touches) return false;
    downHandler(e);
  };

  /**
   * @private
   */
  function mousemoveHandler(e) {
    if (e.touches) return false;
    moveHandler(e);
  };

  /**
   * @private
   */
  function mouseupHandler(e) {
    if (e.touches) return false;
    upHandler(e);
  };

  /**
   * @private
   */
  function execTouchEvent(e, callback) {
    var elem = e.target, data = dataBind(elem)[namespace], options = data.options;
    if (options.multitouch) {
      // Track all fingers.
      var touches = e.changedTouches;
      for (var i = 0; i < touches.length; i++) {
        var touch = touches[i];
        // Add the type of event to the touch object.
        touch.type = e.type;
        callback(touch);
      }
    } else {
      // Track only the current finger.
      var touch = e.touches[0];
      // Add the type of event to the touch object.
      touch.type = e.type;
      callback(touch);
    }
    e.preventDefault();
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
    if (Event.isRightClick(e)) return false;

    var idx = e.identifier || 0;
    var elem = e.target, data = dataBind(elem)[namespace], options = data.options;
    // Exit early if interactivity is disabled.
    if (!options.interactive) return;

    data.sketch.isDrawing = true;
    var p = getMousePos(e);
    // Mark visually 1st point of stroke.
    if (options.graphics.firstPointSize > 0) {
      data.sketch.beginFill(options.graphics.fillStyle).fillCircle(p.x, p.y, options.graphics.firstPointSize).endFill();
    }
    // Ensure that coords is properly initialized.
    if (!data.coords[idx]) {
      data.coords[idx] = [];
    }
    // Don't mix mouseup and mousedown in the same stroke.
    if (data.coords[idx].length > 0) {
      data.strokes.push(data.coords[idx]);
      data.coords[idx] = [];
    }
    saveMousePos(idx, data, p);

    if (typeof options.events.mousedown === 'function') {
      options.events.mousedown(elem, data, e);
    }
  };

  /**
   * @private
   */
  function moveHandler(e) {
    var idx = e.identifier || 0;
    var elem = e.target, data = dataBind(elem)[namespace], options = data.options;

    if (!options.interactive) return;
    //if (!options.mouseupMovements && !data.sketch.isDrawing) return;
    // This would grab all penup strokes AFTER drawing something on the canvas for the first time.
    if ( (!options.mouseupMovements || data.strokes.length === 0) && !data.sketch.isDrawing ) return;

    var p = getMousePos(e);
    if (data.sketch.isDrawing) {
      var last = data.coords[idx][ data.coords[idx].length - 1 ];
      data.sketch.beginPath().line(last[0], last[1], p.x, p.y).stroke().closePath();
    }
    saveMousePos(idx, data, p);

    if (typeof options.events.mousemove === 'function') {
      options.events.mousemove(elem, data, e);
    }
  };

  /**
   * @private
   */
  function upHandler(e) {
    var idx = e.identifier || 0;
    var elem = e.target, data = dataBind(elem)[namespace], options = data.options;

    if (!options.interactive) return;

    data.sketch.isDrawing = false;
    data.strokes.push(data.coords[idx]);
    data.coords[idx] = [];

    if (typeof options.events.mouseup === 'function') {
      options.events.mouseup(elem, data, e);
    }
  };

  // Expose.
  window.Sketchable = Sketchable;

})(this);
