/*!
 * jQuery sketchable 1.5 | Luis A. Leiva | MIT license
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
  // config options + namespace ID
  var options, _ns = "sketchable";
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
      // options will be available for all plugin methods
      options = $.extend({}, $.fn.sketchable.defaults, opts);
      return this.each(function() {
        var elem = $(this), data = elem.data(_ns);
        // first-time checks
        if (!data) {
          // TODO: add more drawing properties (and set them configurable)
          var sketch = new jSketch(this, {
            fillStyle: options.graphics.fillStyle,
            strokeStyle: options.graphics.strokeStyle,
            lineWidth: options.graphics.lineWidth,
          });
          // Flag drawing state.
          sketch.isDrawing = false;
          elem.data(_ns, {
            // All strokes will be stored here.
            strokes: [], 
            // This array represents a single stroke.
            coords: [],  
            // Date of first coord, used as time origin.
            timestamp: new Date().getTime(),
            // Save a pointer to the drawing canvas.
            canvas: sketch
          });
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
        if (typeof options.events.create === 'function') {
          options.events.create(elem, elem.data(_ns));
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
     *                * data: canvas (DOM element)
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
     * Clears canvas (and strokes data).
     * @return jQuery
     * @name clear
     * @methodOf methods
     * @example $(selector).sketchable('clear');
     */
    clear: function() {
      return this.each(function() {
        var elem = $(this), data = elem.data(_ns);
        data.canvas.clear();
        data.strokes = [];
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
        var elem = $(this), data = elem.data(_ns);
        elem.sketchable('destroy').sketchable(opts);
        if (typeof options.events.reset === 'function') {
          options.events.reset(elem, data);
        }
      });        
    },
    /** 
     * Destroys sketchable canvas (and strokes data).
     * @return jQuery
     * @name destroy
     * @methodOf methods     
     * @example $(selector).sketchable('destroy');     
     */
    destroy: function() {
      return this.each(function(){
        var elem = $(this), data = elem.data(_ns);
        if (options.interactive) {
          elem.unbind("mousedown", mousedownHandler);
          elem.unbind("mouseup", mouseupHandler);
          elem.unbind("mousemove", mousemoveHandler);
          elem.unbind("touchstart", touchHandler);
          elem.unbind("touchend", touchHandler);
          elem.unbind("touchmove", touchHandler);
        }
        elem.removeData(_ns)//.remove();
        if (typeof options.events.destroy === 'function') {
          options.events.destroy(elem, data);
        }
      });
    }
    
  };

  /** 
   * Creates a new jQuery.sketchable object.
   * @param {String|Object} method name of the method to invoke, 
   *  or a configuration object.
   * @returns jQuery
   * @class
   * @version 1.5
   * @date 9 Apr 2014
   * @example 
   * $(selector).sketchable();
   * $(selector).sketchable({interactive:false});
   */
  $.fn.sketchable = function(method) {
    if (methods[method]) {
      return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
    } else if (typeof method === 'object' || !method) {
      return methods.init.apply(this, arguments);
    } else {
      $.error('Method '+ method +' does not exist on jQuery.sketchable');
    }
    return this;
  };
  
  /** 
   * Default configuration (publicly modifiable).
   * Note that on[···] callbacks are triggered only if interactive == true.
   * @name defaults
   * @default
   * @memberOf $.fn.sketchable
   * @example
   * $(selector).sketchable({
   *   interactive: true,
   *   mouseUpMovements: false,
   *   events: {
   *     create: function(elem, data){}, 
   *     clear: function(elem, data){}, 
   *     destroy: function(elem, data){}, 
   *     mouseDown: function(elem, data, evt){}, 
   *     mouseMove: function(elem, data, evt){}, 
   *     mouseUp: function(elem, data, evt){}, 
   *   },
   *   graphics: {
   *     firstPointSize: 0,    
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
    mouseUpMovements: false,
    // Callback Event
    events: {
      // create: function(elem, data){}, 
      // clear: function(elem, data){}, 
      // destroy: function(elem, data){}, 
      // mouseDown: function(elem, data, evt){}, 
      // mouseMove: function(elem, data, evt){}, 
      // mouseUp: function(elem, data, evt){}, 
    },
    // TODO: add more jSketch config options
    graphics: {
      firstPointSize: 0,
      lineWidth: 3,
      strokeStyle: '#F0F',
      fillStyle: '#F0F'
      //lineCap: 
      //lineJoin: 
      //miterLimit: 
    }
  };



  function getMousePos(e) {
    var elem = $(e.target), pos = elem.offset();
    return {
      x: Math.round(e.pageX - pos.left),
      y: Math.round(e.pageY - pos.top)
    }
  };

  function saveMousePos(data, pt) {
    //var delta = (new Date).getTime() - data.timestamp;
    var time = (new Date).getTime();
    data.coords.push([ pt.x, pt.y, time, data.canvas.isDrawing ]);
  };
  
  function mousemoveHandler(e) {
    var elem = $(e.target), data = elem.data(_ns);
    if (!options.mouseUpMovements && !data.canvas.isDrawing) return;
    
    var p = getMousePos(e);
    if (data.canvas.isDrawing) data.canvas.lineTo(p.x, p.y);
    saveMousePos(data, p);
    if (typeof options.events.mouseMove === 'function') {
      options.events.mouseMove(elem, data, e);
    }
  };
            
  function mousedownHandler(e) {
    var elem = $(e.target), data = elem.data(_ns);  
    data.canvas.isDrawing = true;
    var p = getMousePos(e);
    data.canvas.beginPath();
    // Mark visually 1st point of stroke.
    if (options.graphics.firstPointSize > 0) {
      data.canvas.fillCircle(p.x, p.y, options.graphics.firstPointSize);
    }
    saveMousePos(data, p);
    if (typeof options.events.mouseDown === 'function') {
      options.events.mouseDown(elem, data, e);
    }
  };
      
  function mouseupHandler(e) {
    var elem = $(e.target), data = elem.data(_ns);
    data.canvas.isDrawing = false;
    data.canvas.closePath();
    data.strokes.push(data.coords);
    data.coords = [];
    if (typeof options.events.mouseUp === 'function') {
      options.events.mouseUp(elem, data, e);
    }
  };

  function touchHandler(e) {
    e.preventDefault();
    var elem = $(e.target);
    var touch = e.originalEvent.changedTouches[0];
    // Copy original event properties to touch event.
    for (var o in e) {
      touch[o] = e[o];
    }
    // Remove (emulated) mouse events on mobile devices.
    switch(e.type) {
      case "touchstart": 
        elem.unbind(e.type, mousedownHandler);
        mousedownHandler(touch);
        break;
      case "touchmove":
        elem.unbind(e.type, mousemoveHandler);
        mousemoveHandler(touch);
        break;
      case "touchend":
        elem.unbind(e.type, mouseupHandler);
        mouseupHandler(touch);
        break;
      default: 
        return;
    }
  };

})(jQuery);
