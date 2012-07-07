/*!
 * jQuery sketchable 1.3 | Luis A. Leiva | MIT license
 * This is a jQuery plugin built on top of jSketch drawing class.
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
          })//.background(options.graphics.background); // let user decide...
          
          elem.data(_ns, {
            strokes: [], // mouse strokes
            coords: [],  // a single stroke
            canvas: sketch
          });
          
          if (options.interactive) {
            elem.bind("mousedown", mousedownHandler);
            elem.bind("mouseup", mouseupHandler);
            elem.bind("mousemove", mousemoveHandler);
            elem.bind("touchstart", touchHandler);
            elem.bind("touchend", touchHandler);
            elem.bind("touchmove", touchHandler);
            // fix Chrome "bug"
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
     * @param Array arr data strokes: multidimensional array of [x,y,status]'s; status = 0 (pen down) or 1 (pen up)
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
   * @version 1.3
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
   *   events: {
   *     create: function(elem,data){},
   *     clear: function(elem,data){},
   *     destroy: function(elem,data){},      
   *     mouseDown: function(evt){}, 
   *     mouseMove: function(evt){}, 
   *     mouseUp: function(evt){},      
   *   },
   *   graphics: {
   *     lineWidth: 2,
   *     strokeStyle: '#F0F',
   *     fillStyle: '#F0F',
   *     lineCap: "round",
   *     lineJoin: "round",
   *     miterLimit: 10
   *   }
   * });
   */
  $.fn.sketchable.defaults = {
    // if interactive is set to true, you can:
    // * draw on canvas via mouse/pen/touch input
    // * assign callbacks to onMouseDown(evt), onMouseMove(evt), onMouseUp(evt)
    interactive: true,
    events: {
      // create: function(elem,data){},
      // clear: function(elem,data){},
      // destroy: function(elem,data){},
      // mouseDown: function(evt){}, 
      // mouseMove: function(evt){}, 
      // mouseUp: function(evt){},
    },
    // TODO: add more jSketch config options
    graphics: {
      fillStyle: '#F0F', 
      strokeStyle: '#F0F',
      lineWidth: 2
      //lineCap: 
      //lineJoin: 
      //miterLimit: 
    }
  };



  // main drawing callbacks if interactive is set to true ----------------------
      
  function getMousePos(e) {
    var elem = $(e.target), pos = elem.offset();
    return {
      x: e.pageX - pos.left,
      y: e.pageY - pos.top
    }
  };
      
  function mousemoveHandler(e) {
    var elem = $(e.target), data = elem.data(_ns);
    if (!data.canvas.isDrawing) return;
    var p = getMousePos(e);
    data.canvas.lineTo(p.x, p.y);
    //data.coords.push({ x:p.x, y:p.y, type:0 });
    data.coords.push([ p.x, p.y, 0 ]);
    if (typeof options.events.mouseMove === 'function') {
      options.events.mouseMove(e);
    }     
  };
            
  function mousedownHandler(e) {
    var elem = $(e.target), data = elem.data(_ns);  
    data.canvas.isDrawing = true;
    var p = getMousePos(e);
    data.canvas.beginPath();
    // mark visually 1st point of stroke
    data.canvas.fillCircle(p.x,p.y,options.graphics.lineWidth);
    //data.coords.push({ x:p.x, y:p.y, type:1 });
    data.coords.push([ p.x, p.y, 1 ]);
    if (typeof options.events.mouseDown === 'function') {
      options.events.mouseDown(e);
    }
  };
      
  function mouseupHandler(e) {
    var elem = $(e.target), data = elem.data(_ns);
    data.canvas.isDrawing = false;
    data.canvas.closePath();
    data.strokes.push(data.coords);
    data.coords = [];
    if (typeof options.events.mouseUp === 'function') {
      options.events.mouseUp(e);
    }
  };

  function touchHandler(e) {
    e.preventDefault();
    var elem = $(e.target);
    var touch = e.originalEvent.changedTouches[0];
    touch.type = e.type;
    // remove (emulated) mouse events on mobile devices
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
