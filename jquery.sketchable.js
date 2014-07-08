/*!
 * jQuery sketchable | v1.7 | Luis A. Leiva | MIT license
 * This is a jQuery plugin for the jSketch drawing class.
 */
/**
 * @name $
 * @class 
 * See <a href="http://jquery.com/">the jQuery library</a> for full details.  
 * This just documents the method that is added to jQuery by this plugin.
 */
/**
 * @name $.fn
 * @class 
 * See <a href="http://jquery.com/">the jQuery library</a> for full details.  
 * This just documents the method that is added to jQuery by this plugin.
 */
;(function($){
  // Custom namespace ID.
  var _ns = "sketchable";
  /** 
   * Note: This is NOT a constructor actually, but a series of methods to be 
   * called from the plugin.
   * @name methods
   * @class
   * Plugin API.
   */
  var methods = {
    /** 
     * Initializes the selected jQuery objects.      
     * @param {Object} opts plugin configuration (see defaults)
     * @return jQuery
     * @name init
     * @ignore
     * @methodOf methods
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
            elem.bind("mouseup", mouseupHandler);
            elem.bind("mousemove", mousemoveHandler);
            elem.bind("touchstart", touchHandler);
            elem.bind("touchend", touchHandler);
            elem.bind("touchmove", touchHandler);
            // Fix Chrome "bug".
            this.onselectstart = function(){ return false };
          }
        }
        var sketch = new jSketch(this, options.graphics);
//        sketch.beginPath();
        // Flag drawing state on a per-canvas basis.
        sketch.isDrawing = false;
        // Reconfigure element data.
        elem.data(_ns, {
          // All strokes will be stored here.
          strokes: [], 
          // This will store one stroke per touching finger.
          coords: {}, 
          // Date of first coord, used as time origin.
          timestamp: new Date().getTime(), 
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
     * @param Array arr data strokes: multidimensional array of {x,y,time,status} tuples; status = 0 (pen down) or 1 (pen up)
     * @return Strokes object on get, jQuery on set (with the new data attached)
     * @name strokes
     * @methodOf methods
     * @example
     * $(selector).sketchable('strokes');
     * $(selector).sketchable('strokes', [ [arr1], ..., [arrN] ]);
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
     * @param Object callback function, invoked with 2 arguments:
     *                * elem: jQuery element
     *                * data: element data
     * @return jQuery
     * @name handler
     * @methodOf methods
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
     * @return jQuery
     * @name clear
     * @methodOf methods
     * @example $(selector).sketchable('clear');
     */
    clear: function() {
      return this.each(function() {
        var elem = $(this), data = elem.data(_ns), options = data.options;
        data.sketch.clear();
        data.strokes = [];
        data.coords  = {};
        if (typeof options.events.clear === 'function') {
          options.events.clear(elem, data);
        }
      });
    },
    /** 
     * Reinitializes a sketchable canvas with given opts.
     * @param Object opts configuration options
     * @return jQuery
     * @name reset
     * @methodOf methods
     * @example 
     * $(selector).sketchable('reset');
     * $(selector).sketchable('reset', {interactive:false});
     */    
    reset: function(opts) {
      return this.each(function(){
        var elem = $(this), data = elem.data(_ns), options = data.options;
        elem.sketchable('destroy').sketchable(opts);
        if (typeof options.events.reset === 'function') {
          options.events.reset(elem, data);
        }
      });        
    },
    /** 
     * Destroys sketchable canvas (together with strokes data and events).
     * @return jQuery
     * @name destroy
     * @methodOf methods     
     * @example $(selector).sketchable('destroy');     
     */
    destroy: function() {
      return this.each(function(){
        var elem = $(this), data = elem.data(_ns), options = data.options;
        if (options.interactive) {
          elem.unbind("mousedown", mousedownHandler);
          elem.unbind("mouseup", mouseupHandler);
          elem.unbind("mousemove", mousemoveHandler);
          elem.unbind("touchstart", touchHandler);
          elem.unbind("touchend", touchHandler);
          elem.unbind("touchmove", touchHandler);
        }
        elem.removeData(_ns);
        if (typeof options.events.destroy === 'function') {
          options.events.destroy(elem, data);
        }
      });
    }
    
  };

  /** 
   * Creates a new jQuery.sketchable object.
   * @param {String|Object} method name of the method to invoke, or a configuration object.
   * @return jQuery
   * @class
   * @example
   * $(selector).sketchable();
   * $(selector).sketchable({interactive:false});
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
   * Default configuration (publicly modifiable).
   * Note that mouse[···] callbacks are triggered only if interactive is set to true.
   * @name defaults
   * @default
   * @memberOf $.fn.sketchable
   * @example
   * $(selector).sketchable({
   *   interactive: true,
   *   mouseupMovements: false,
   *   relTimestamps: false,
   *   events: {
   *     init: function(elem, data){}, 
   *     clear: function(elem, data){}, 
   *     destroy: function(elem, data){}, 
   *     mousedown: function(elem, data, evt){}, 
   *     mousemove: function(elem, data, evt){}, 
   *     mouseup: function(elem, data, evt){}, 
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
    // Inidicate whether timestamps should be relative (start at time 0) or absolute (start at Unix epoch).
    relTimestamps: false,
    // Callback Event
    events: {
      // init: function(elem, data){}, 
      // clear: function(elem, data){}, 
      // destroy: function(elem, data){}, 
      // mousedown: function(elem, data, evt){}, 
      // mousemove: function(elem, data, evt){}, 
      // mouseup: function(elem, data, evt){}, 
    },
    // TODO: add more jSketch config options
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



  function getMousePos(e) {
    var elem = $(e.target), pos = elem.offset();
    return {
      x: Math.round(e.pageX - pos.left),
      y: Math.round(e.pageY - pos.top)
    }
  };

  function saveMousePos(idx, data, pt) {
    var time = (new Date).getTime();
    if (data.options.relTimestamps) {
      // The first timestamp is relative to initialization time;
      // thus fix it so that it is relative to the timestamp of the first stroke.
      if (data.strokes.length === 0 && data.coords[idx].length === 0) data.timestamp = time;
      time -= data.timestamp;
    }
    data.coords[idx].push([ pt.x, pt.y, time, +data.sketch.isDrawing ]);
  };
  
  function mousemoveHandler(e, idx) {
    if (typeof idx === 'undefined') idx = 0;
    
    var elem = $(e.target), data = elem.data(_ns), options = data.options;
    //if (!options.mouseupMovements && !data.sketch.isDrawing) return;
    // This would grab all penup strokes AFTER drawing something on the canvas for the first time.
    if ( (!options.mouseupMovements || data.strokes.length === 0) && !data.sketch.isDrawing ) return;
    
    var p = getMousePos(e);
    if (data.sketch.isDrawing) {
      var last = data.coords[idx][ data.coords[idx].length - 1 ];
      data.sketch.beginPath().line(last[0], last[1], p.x, p.y).closePath();
    }
    saveMousePos(idx, data, p);
    if (typeof options.events.mousemove === 'function') {
      options.events.mousemove(elem, data, e);
    }
  };
            
  function mousedownHandler(e, idx) {
    if (typeof idx === 'undefined') idx = 0;
    
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
  
  function mouseupHandler(e, idx) {
    if (typeof idx === 'undefined') idx = 0;
    
    var elem = $(e.target), data = elem.data(_ns), options = data.options;
    data.sketch.isDrawing = false;
    data.strokes.push(data.coords[idx]);
    data.coords[idx] = [];
    if (typeof options.events.mouseup === 'function') {
      options.events.mouseup(elem, data, e);
    }
  };
  
  function touchHandler(e) {
    e.preventDefault();
    var elem = $(e.target);
    var touch = e.originalEvent.changedTouches;
    // Remove (emulated) mouse events on mobile devices.
    switch (e.type) {
      case "touchstart": 
        elem.unbind(e.type, mousedownHandler);
        for (var i = 1, t = touch[i-1]; i <= touch.length; i++) {
          for (var o in e) t[o] = e[o];
          mousedownHandler(t, t.identifier);
        }
        break;
      case "touchmove":
        elem.unbind(e.type, mousemoveHandler);
        for (var i = 1, t = touch[i-1]; i <= touch.length; i++) {
          for (var o in e) t[o] = e[o];
          mousemoveHandler(t, t.identifier);
        }
        break;
      case "touchend":
        elem.unbind(e.type, mouseupHandler);
        for (var i = 1, t = touch[i-1]; i <= touch.length; i++) {
          for (var o in e) t[o] = e[o];
          mouseupHandler(t, t.identifier);
        }
        break;
      default: 
        return;
    }
    return false;
  };

})(jQuery);
