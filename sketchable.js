/*!
 * sketchable | v1.8 | Luis A. Leiva | MIT license
 * A plugin for the jSketch drawing library.
 */
/*
  Requires sketchable.utils.js to be loaded first.
  globals: Event, dataBind, deepExtend.
*/
;(function(window){
  // Custom namespace ID.
  var _ns = "sketchable";
  /**
   * Creates a <tt>sketchable</tt> instance.
   * This is a plugin for the <tt>jSketch</tt> drawing class.
   * @param {String|Object} method - Method to invoke, or a configuration object.
   * @return jSketchable
   * @class
   * @version 1.8
   * @date 9 Jul 2014
   * @author Luis A. Leiva
   * @license MIT license
   * @example
   * var canvas = document.getElementById('foo');
   * var sketcher = new Sketchable(canvas, {interactive:false});
   * @see methods
   */
  /**
   * @constructor
   * @param {Object} elem - MUST be a DOM element
   * @param {Object} options - Configuration
   */
  var jSketchable = function(elem, options) {
    return new Sketchable(elem, options);
  };

  var Sketchable = function(elem, options) {
    // Although discouraged, we can instantiate the class without arguments.
    if (!elem) return;
    this.elem = elem;
    // We can pass default setup values.
    if (typeof options === 'undefined') options = {};
    // Instantiate the class.
    return this.init(options);
  };

  /**
   * jSketchable methods (publicly extensible).
   * @ignore
   * @memberof jSketchable
   * @see jSketchable
   */
  jSketchable.fn = Sketchable.prototype = {
    /**
     * Initializes the selected objects.
     * @param {Object} opts plugin configuration (see defaults).
     * @return jSketchable
     * @ignore
     * @namespace methods.init
     * @example $(selector).sketchable();
     */
    init: function(opts) {
      // Options will be available for all plugin methods.
      var options = deepExtend(jSketchable.fn.defaults, opts || {});
      var elem = this.elem, data = dataBind(elem)[_ns];
      // Check if element is not initialized yet.
      if (!data) {
        // Attach event listeners.
        if (options.interactive) {
          Event.add(elem, "mousedown", mousedownHandler);
          Event.add(elem, "mousemove", mousemoveHandler);
          Event.add(elem, "mouseup", mouseupHandler);
          Event.add(elem, "touchstart", touchdownHandler);
          Event.add(elem, "touchmove", touchmoveHandler);
          Event.add(elem, "touchend", touchupHandler);
          // Fix Chrome "bug".
          this.onselectstart = function(){ return false };
        }
        if (options.cssCursors) {
          // Visually indicate whether this element is interactive or not.
          elem.style.cursor = options.interactive ? "pointer" : "not-allowed";
        }
      }
      var sketch = new jSketch(elem, options.graphics);
      // Reconfigure element data.
      dataBind(elem)[_ns] = {
        // All strokes will be stored here.
        strokes: [],
        // This will store one stroke per touching finger.
        coords: {},
        // Date of first coord, used as time origin.
        timestamp: (new Date).getTime(),
        // Save a pointer to the drawing canvas (jSketch instance).
        sketch: sketch,
        // Save also a pointer to the given options.
        options: options
      };
      // Trigger init event.
      if (typeof options.events.init === 'function') {
        options.events.init(elem, dataBind(elem)[_ns]);
      }
      // Make methods chainable.
      return this;
    },
    /**
     * Changes config on the fly of an existing sketchable element.
     * @param {Object} opts - Plugin configuration (see defaults).
     * @return jQuery
     * @namespace methods.config
     * @example
     * $(selector).sketchable('config', { interactive: false }); // Later on:
     * $(selector).sketchable('config', { interactive: true });
     */
    config: function(opts) {
      var elem = this.elem, data = dataBind(elem)[_ns];
      data.options = deepExtend(jSketchable.fn.defaults, opts || {});
      return this;
    },
    /**
     * Gets/Sets drawing data strokes sequence.
     * @param {Array} arr - Multidimensional array of [x,y,time,status] tuples; status = 0 (pen down) or 1 (pen up).
     * @return Strokes object on get, jSketchable on set (with the new data attached)
     * @namespace methods.strokes
     * @example
     * $(selector).sketchable('strokes'); // Getter
     * $(selector).sketchable('strokes', [ [arr1], ..., [arrN] ]); // Setter
     */
    strokes: function(arr) {
      var elem = this.elem;
      if (arr) { // setter
        var data = dataBind(elem)[_ns];
        data.strokes = arr;
        return this;
      } else { // getter
        var data = dataBind(elem)[_ns];
        return data.strokes;
      }
    },
    /**
     * Allows low-level manipulation of the sketchable canvas.
     * @param {Function} callback - Callback function, invoked with 2 arguments: elem (jSketchable element) and data (jSketchable element data).
     * @return jSketchable
     * @namespace methods.handler
     * @example
     * $(selector).sketchable('handler', function(elem, data){
     *   // do something with elem or data
     * });
     */
    handler: function(callback) {
      var elem = this.elem, data = dataBind(elem)[_ns];
      callback(elem, data);
      return this;
    },
    /**
     * Clears canvas (together with strokes data).
     * If you need to clear canvas only, just invoke <tt>data.sketch.clear()</tt> via <tt>$(selector).sketchable('handler')</tt>.
     * @see methods.handler
     * @return jSketchable
     * @namespace methods.clear
     * @example $(selector).sketchable('clear');
     */
    clear: function() {
      var elem = this.elem, data = dataBind(elem)[_ns], options = data.options;
      data.sketch.clear();
      data.strokes = [];
      data.coords  = {};

      if (typeof options.events.clear === 'function') {
        options.events.clear(elem, data);
      }
      return this;
    },
    /**
     * Reinitializes a sketchable canvas with given opts.
     * @param {Object} opts - Configuration options.
     * @return jSketchable
     * @namespace methods.reset
     * @example
     * $(selector).sketchable('reset');
     * $(selector).sketchable('reset', {interactive:false});
     */
    reset: function(opts) {
      var elem = this.elem, data = dataBind(elem)[_ns], options = data.options;
      this.destroy().init(opts);

      if (typeof options.events.reset === 'function') {
        options.events.reset(elem, data);
      }
      return this;
    },
    /**
     * Destroys sketchable canvas (together with strokes data and events).
     * @return jSketchable
     * @namespace methods.destroy
     * @example $(selector).sketchable('destroy');
     */
    destroy: function() {
      var elem = this.elem, data = dataBind(elem)[_ns], options = data.options;
      if (options.interactive) {
        Event.remove(elem, "mouseup", mouseupHandler);
        Event.remove(elem, "mousemove", mousemoveHandler);
        Event.remove(elem, "mousedown", mousedownHandler);
        Event.remove(elem, "touchstart", touchdownHandler);
        Event.remove(elem, "touchmove", touchmoveHandler);
        Event.remove(elem, "touchend", touchupHandler);
      }
      dataBind(elem)[_ns] = null;

      if (typeof options.events.destroy === 'function') {
        options.events.destroy(elem, data);
      }
      return this;
    }

  };

  /**
   * Default configuration.
   * Note that mouse* callbacks are triggered only if <tt>interactive</tt> is set to <tt>true</tt>.
   * @name defaults
   * @default
   * @memberof $.fn.sketchable
   * @example
   * $(selector).sketchable({
   *   interactive: true,
   *   mouseupMovements: false,
   *   relTimestamps: false,
   *   multitouch: false,
   *   cssCursors: true,
   *   events: {
   *     init: function(elem, data){ },
   *     clear: function(elem, data){ },
   *     destroy: function(elem, data){ },
   *     mousedown: function(elem, data, evt){ },
   *     mousemove: function(elem, data, evt){ },
   *     mouseup: function(elem, data, evt){ },
   *   },
   *   graphics: {
   *     firstPointSize: 3,
   *     lineWidth: 3,
   *     strokeStyle: '#F0F',
   *     fillStyle: '#F0F',
   *     lineCap: "round",
   *     lineJoin: "round",
   *     miterLimit: 10
   *   }
   * });
   */
  jSketchable.fn.defaults = {
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
    // Event callbacks.
    events: {
      // init: function(elem, data){ },
      // clear: function(elem, data){ },
      // destroy: function(elem, data){ },
      // mousedown: function(elem, data, evt){ },
      // mousemove: function(elem, data, evt){ },
      // mouseup: function(elem, data, evt){ },
    },
    graphics: {
      firstPointSize: 3,
      lineWidth: 3,
      strokeStyle: '#F0F',
      fillStyle: '#F0F',
      lineCap: "round",
      lineJoin: "round",
      miterLimit: 10
    }
  };

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

  function execTouchEvent(e, callback) {
    var elem = e.target, data = dataBind(elem)[_ns], options = data.options;
    var touches = e.changedTouches;
    if (options.multitouch) {
      for (var i = 0; i < touches.length; i++) {
        var touch = touches[i];
        // Add the type of event to the touch object.
        touch.type = e.type;
        callback(touch);
      }
    } else {
      var touch = touches[0];
      // Add the type of event to the touch object.
      touch.type = e.type;
      callback(touch);
    }
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
    var elem = e.target, data = dataBind(elem)[_ns], options = data.options;
    // Exit early if interactivity is disabled.
    if (!options.interactive) return;

    data.sketch.isDrawing = true;
    var p = getMousePos(e);
    // Mark visually 1st point of stroke.
    if (options.graphics.firstPointSize > 0) {
      data.sketch.fillCircle(p.x, p.y, options.graphics.firstPointSize);
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
    var elem = e.target, data = dataBind(elem)[_ns], options = data.options;
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
    var elem = e.target, data = dataBind(elem)[_ns], options = data.options;
    if (!options.interactive) return;

    data.sketch.isDrawing = false;
    data.strokes.push(data.coords[idx]);
    data.coords[idx] = [];

    if (typeof options.events.mouseup === 'function') {
      options.events.mouseup(elem, data, e);
    }
  };

  // Expose.
  window.Sketchable = jSketchable;

})(this);
