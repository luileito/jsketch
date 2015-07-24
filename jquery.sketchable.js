/*!
 * jQuery sketchable | v1.8 | Luis A. Leiva | MIT license
 * A jQuery plugin for the jSketch drawing library.
 */
/**
 * @name $
 * @class
 * @ignore
 * @description This just documents the method that is added to jQuery by this plugin.
 * See <a href="http://jquery.com/">the jQuery library</a> for full details.
 */
/**
 * @name $.fn
 * @memberof $
 * @description This just documents the method that is added to jQuery by this plugin.
 * See <a href="http://jquery.com/">the jQuery library</a> for full details.
 */
;(function($){
  // Custom namespace ID.
  var _ns = "sketchable";
  /**
   * jQuery sketchable plugin API.
   * @namespace methods
   */
  var methods = {
    /**
     * Initializes the selected jQuery objects.
     * @param {Object} opts plugin configuration (see defaults).
     * @return jQuery
     * @ignore
     * @namespace methods.init
     * @example $(selector).sketchable();
     */
    init: function(opts) {
      // Options will be available for all plugin methods.
      var options = $.extend(true, {}, $.fn.sketchable.defaults, opts || {});
      return this.each(function() {
        var elem = $(this), data = elem.data(_ns);
        // Check if element is not initialized yet.
        if (!data) {
          // Attach event listeners.
          if (options.interactive) {
            elem.bind("mousedown", mousedownHandler);
            elem.bind("mousemove", mousemoveHandler);
            elem.bind("mouseup", mouseupHandler);
            elem.bind("touchstart", touchdownHandler);
            elem.bind("touchmove", touchmoveHandler);
            elem.bind("touchend", touchupHandler);
            // Fix Chrome "bug".
            this.onselectstart = function(){ return false };
          }
        }
        var sketch = new jSketch(this, options.graphics);
        // Flag drawing state on a per-canvas basis.
        sketch.isDrawing = false;
        // Reconfigure element data.
        elem.data(_ns, {
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
        });
        // Trigger init event.
        if (typeof options.events.init === 'function') {
          options.events.init(elem, elem.data(_ns));
        }
      });
    },
    /**
     * Gets/Sets drawing data strokes sequence.
     * @param {Array} arr - Multidimensional array of [x,y,time,status] tuples; status = 0 (pen down) or 1 (pen up).
     * @return Strokes object on get, jQuery on set (with the new data attached)
     * @namespace methods.strokes
     * @example
     * $(selector).sketchable('strokes'); // Getter
     * $(selector).sketchable('strokes', [ [arr1], ..., [arrN] ]); // Setter
     */
    strokes: function(arr) {
      if (arr) { // setter
        return this.each(function() {
          var elem = $(this), data = elem.data(_ns);
          data.strokes = arr;
        });
      } else { // getter
        var data = $(this).data(_ns);
        return data.strokes;
      }
    },
    /**
     * Allows low-level manipulation of the sketchable canvas.
     * @param {Function} callback - Callback function, invoked with 2 arguments: elem (jQuery element) and data (jQuery element data).
     * @return jQuery
     * @namespace methods.handler
     * @example
     * $(selector).sketchable('handler', function(elem, data){
     *   // do something with elem or data
     * });
     */
    handler: function(callback) {
      return this.each(function() {
        var elem = $(this), data = elem.data(_ns);
        callback(elem, data);
      });
    },
    /**
     * Clears canvas (together with strokes data).
     * If you need to clear canvas only, just invoke <tt>data.sketch.clear()</tt> via <tt>$(selector).sketchable('handler')</tt>.
     * @see methods.handler
     * @return jQuery
     * @namespace methods.clear
     * @example $(selector).sketchable('clear');
     */
    clear: function() {
      return this.each(function() {
        var elem = $(this), data = elem.data(_ns) || {}, options = data.options;
        if (data.sketch) {
          data.sketch.clear();
          data.strokes = [];
          data.coords  = {};
        }
        if (options && typeof options.events.clear === 'function') {
          options.events.clear(elem, data);
        }
      });
    },
    /**
     * Reinitializes a sketchable canvas with given opts.
     * @param {Object} opts - Configuration options.
     * @return jQuery
     * @namespace methods.reset
     * @example
     * $(selector).sketchable('reset');
     * $(selector).sketchable('reset', {interactive:false});
     */
    reset: function(opts) {
      return this.each(function(){
        var elem = $(this), data = elem.data(_ns) || {}, options = data.options;
        elem.sketchable('destroy').sketchable(opts);

        if (options && typeof options.events.reset === 'function') {
          options.events.reset(elem, data);
        }
      });
    },
    /**
     * Destroys sketchable canvas (together with strokes data and events).
     * @return jQuery
     * @namespace methods.destroy
     * @example $(selector).sketchable('destroy');
     */
    destroy: function() {
      return this.each(function(){
        var elem = $(this), data = elem.data(_ns) || {}, options = data.options;
        if (options.interactive) {
          elem.unbind("mouseup", mouseupHandler);
          elem.unbind("mousemove", mousemoveHandler);
          elem.unbind("mousedown", mousedownHandler);
          elem.unbind("touchstart", touchdownHandler);
          elem.unbind("touchmove", touchmoveHandler);
          elem.unbind("touchend", touchupHandler);
        }
        elem.removeData(_ns);

        if (options && typeof options.events.destroy === 'function') {
          options.events.destroy(elem, data);
        }
      });
    }

  };

  /**
   * Creates a <tt>jQuery.sketchable</tt> instance.
   * This is a jQuery plugin for the <tt>jSketch</tt> drawing class.
   * @param {String|Object} method - Method to invoke, or a configuration object.
   * @return jQuery
   * @class
   * @version 1.8
   * @date 9 Jul 2014
   * @author Luis A. Leiva
   * @license MIT license
   * @example
   * $(selector).sketchable();
   * $(selector).sketchable({interactive:false});
   * @see methods
   */
  $.fn.sketchable = function(method) {
    // These "magic" keywords return internal plugin methods,
    // so that they can be easily extended/overriden.
    if ("methods functions hooks".split(" ").indexOf(method) > -1) {
      return methods;
    } else if (methods[method]) {
      return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
    } else if (typeof method === 'object' || !method) {
      return methods.init.apply(this, arguments);
    } else {
      $.error('Method '+ method +' does not exist. See jQuery.sketchable("methods").');
    }
    return this;
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

  /**
   * @private
   */
  function getMousePos(e) {
    var elem = $(e.target), pos = elem.offset();
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
    var elem = $(e.target), data = elem.data(_ns), options = data.options;
    var touches = e.originalEvent.changedTouches;
    if (options.multitouch) {
      for (var i = 0; i < touches.length; i++) {
        var touch = touches[i];
        downHandler(touch);
      }
    } else {
      downHandler(touches[0]);
    }
    e.preventDefault();
  };

  /**
   * @private
   */
  function touchmoveHandler(e) {
    var elem = $(e.target), data = elem.data(_ns), options = data.options;
    var touches = e.originalEvent.changedTouches;
    if (options.multitouch) {
      for (var i = 0; i < touches.length; i++) {
        var touch = touches[i];
        moveHandler(touch);
      }
    } else {
      moveHandler(touches[0]);
    }
    e.preventDefault();
  };

  /**
   * @private
   */
  function touchupHandler(e) {
    var elem = $(e.target), data = elem.data(_ns), options = data.options;
    var touches = e.originalEvent.changedTouches;
    if (options.multitouch) {
      for (var i = 0; i < touches.length; i++) {
        var touch = touches[i];
        upHandler(touch);
      }
    } else {
      upHandler(touches[0]);
    }
    e.preventDefault();
  };

  /**
   * @private
   */
  function downHandler(e) {
    // Don't handle right clicks.
    if (e.which === 3) return false;

    var idx = e.identifier || 0;
    var elem = $(e.target), data = elem.data(_ns), options = data.options;
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
    var elem = $(e.target), data = elem.data(_ns), options = data.options;
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
    var elem = $(e.target), data = elem.data(_ns), options = data.options;
    data.sketch.isDrawing = false;
    data.strokes.push(data.coords[idx]);
    data.coords[idx] = [];

    if (typeof options.events.mouseup === 'function') {
      options.events.mouseup(elem, data, e);
    }
  };

})(jQuery);
