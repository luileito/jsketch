/*!
 * jSketch 0.6 | Luis A. Leiva | MIT license
 * A simple JavaScript library for drawing facilities on HTML5 canvas.
 */
/**
 * A simple JavaScript library for drawing facilities on HTML5 canvas.
 * This class is mostly a wrapper for the HTML5 canvas API with some sugar, 
 * such as object chainability and old-school AS3-like notation.
 * @name jSketch
 * @class
 * @author Luis Leiva
 * @version 0.6
 * @date 16 Jan 2012
 * @since 2010
 * @example
 * var canvas1 = document.getElementById('foo');
 * var canvas2 = document.getElementById('bar'); 
 * // instantiate once, reuse everywhere
 * var brush = new jSketch(canvas1).lineStyle('red').moveTo(50,50).lineTo(10,10);
 * brush.context(canvas2).beginFill('#5F7').fillCircle(30,30,8).endFill();
 */
(function(window){
    /**
     * @constructor
     * @param {Object} elem MUST be a DOM element
     * @param {Object} options configuration
     */
    var jSketch = function(elem, options){
      return new Sketch(elem, options);
    };
    // base class (private)
    var Sketch = function(elem, options){
      // although discouraged, we can instantiate the class without arguments
      if (!elem) return;
      // one can pass default setup values
      if (typeof options === 'undefined') options = {};
      // set drawing context first
      this.context(elem);
      // scene defaults
      this.stageWidth  = elem.getAttribute("width");
      this.stageHeight = elem.getAttribute("height");
      // drawing defaults
      this.graphics.fillStyle   = typeof options.fillStyle   !== 'undefined' ? options.fillStyle   : '#F00';
      this.graphics.strokeStyle = typeof options.strokeStyle !== 'undefined' ? options.strokeStyle : '#F0F';
      this.graphics.lineWidth   = typeof options.lineWidth   !== 'undefined' ? options.lineWidth   : 2;
      this.graphics.lineCap     = typeof options.lineCap     !== 'undefined' ? options.lineCap     : 'round';
      this.graphics.lineJoin    = typeof options.lineJoin    !== 'undefined' ? options.lineJoin    : 'round';
      this.graphics.mitterLimit = typeof options.mitterLimit !== 'undefined' ? options.mitterLimit : 10;
      // make room for storing some data such as brush type, colors, etc.
      this.data = {};
      // make constructor chainable
      return this;
    };
   /** 
    * jSketch methods (publicly extensible).
    * @class
    * @memberOf jSketch
    * @see jSketch
    */    
    jSketch.fn = Sketch.prototype = {
      /**
       * Allows to change the drawing context at runtime.
       * @param {Object} elem DOM element
       * @return jSketch
       * @name context
       * @methodOf jSketch
       */
      context: function(elem) {
        if (elem == null) throw("No canvas element specified.");
        // save shortcuts: canvas (DOM elem) & graphics (2D canvas context)
        this.canvas = elem;
        this.graphics = elem.getContext("2d");
        // allow chainability
        return this;
      },
      /**
       * Sets the dimensions of canvas.
       * @param {Number} width
       * @param {Number} height       
       * @return jSketch
       * @name size
       * @methodOf jSketch
       */
      size: function(width,height) {
        this.stageWidth  = width;
        this.stageHeight = height;
        this.canvas.width  = width;
        this.canvas.height = height;
        return this;
      },
      /**
       * Sets the background color of canvas.
       * @param {Number|String} color an HTML color
       * @return jSketch
       * @name background
       * @methodOf jSketch
       */
      background: function(color) {
        var oldFill = this.graphics.fillStyle;
        this.beginFill(color);
        this.graphics.fillRect(0,0,this.stageWidth,this.stageHeight);
        this.beginFill(oldFill); // restore old fill
        return this;
      },
      /**
       * Shortcut for setting the size + background color.
       * @param {Number} width
       * @param {Number} height       
       * @param {Number|String} color an HTML color
       * @return jSketch
       * @name stage
       * @methodOf jSketch
       */
      stage: function(width,height,bgcolor) {
        this.size(width,height).background(bgcolor);
        return this;
      },
      /**
       * Sets the fill color.
       * @param {Number|String} color an HTML color
       * @return jSketch
       * @name beginFill
       * @methodOf jSketch
       */
      beginFill: function(color) {
        this.data.fillStyle = this.graphics.fillStyle;
        this.graphics.fillStyle = color;
        return this;
      },
      /**
       * Recovers the fill color that was set before <code>beginFill()</code>.
       * @return jSketch
       * @name endFill
       * @methodOf jSketch
       */
      endFill: function() {
        this.graphics.fillStyle = this.data.fillStyle;
        return this;
      },
      /**
       * Sets the line style.
       * @param {Number|String} color an HTML color
       * @param {Number} thickness line thickness
       * @param {String} thickness style of line cap
       * @param {String} joinStyle style of line join
       * @param {String} mitter style of mitter       
       * @return jSketch
       * @name lineStyle
       * @methodOf jSketch
       */
      lineStyle: function(color,thickness,capStyle,joinStyle,mitter) {
        this.graphics.strokeStyle = color     || this.graphics.strokeStyle;
        this.graphics.lineWidth   = thickness || this.graphics.lineWidth;
        this.graphics.lineCap     = capStyle  || this.graphics.lineCap;
        this.graphics.lineJoin    = joinStyle || this.graphics.lineJoin;
        this.graphics.mitterLimit = mitter    || this.graphics.mitterLimit;
        return this;
      },
      /**
       * Move brush to a coordinate in canvas.
       * @param {Number} x
       * @param {Number} y
       * @return jSketch
       * @name moveTo
       * @methodOf jSketch
       */
      moveTo: function(x,y) {
        this.graphics.moveTo(x,y);
        return this;
      },
      /**
       * Draws line to given coordinate.
       * @param {Number} x
       * @param {Number} y
       * @return jSketch
       * @name lineTo
       * @methodOf jSketch
       */
      lineTo: function(x,y) {
        this.graphics.lineTo(x,y);
        this.graphics.stroke();
        return this;
      },
      /**
       * Draws line from coordinate 1 to coordinate 2.
       * @param {Number} x1
       * @param {Number} y1
       * @param {Number} x2
       * @param {Number} y2       
       * @return jSketch
       * @name line
       * @methodOf jSketch
       */
      line: function(x1,y1,x2,y2) {
        this.graphics.moveTo(x1,y1);
        this.lineTo(x2,y2);
        return this;
      },
      /**
       * Draws curve to given coordinate.
       * @param {Number} x
       * @param {Number} y
       * @param {Number} cpx x coordinate of control point
       * @param {Number} cpy y coordinate of control point
       * @return jSketch
       * @name curveTo
       * @methodOf jSketch
       */
      curveTo: function(x,y,cpx,cpy) {
        this.graphics.quadraticCurveTo(cpx,cpy,x,y);
        this.graphics.stroke();
        return this;
      },
      /**
       * Draws curve from coordinate 1 to coordinate 2.
       * @param {Number} x1
       * @param {Number} y1
       * @param {Number} x2
       * @param {Number} y2       
       * @param {Number} cpx x coordinate of control point
       * @param {Number} cpy y coordinate of control point
       * @return jSketch
       * @name curve
       * @methodOf jSketch
       */
      curve: function(x1,y1,x2,y2,cpx,cpy) {
        this.graphics.moveTo(x1,y1);
        this.curveTo(x2,y2,cpx,cpy);
        return this;
      },
      /**
       * Draws a stroke-only rectangle.
       * @param {Number} x
       * @param {Number} y
       * @param {Number} width
       * @param {Number} height
       * @return jSketch
       * @name strokeRect
       * @methodOf jSketch
       */      
      strokeRect: function(x,y,width,height) {
        this.graphics.beginPath();
        //this.moveTo(x,y).lineTo(x+width,y).lineTo(x+width,y+height).lineTo(y,y+height).lineTo(x,y);
        this.graphics.strokeRect(x,y,width,height);
        this.graphics.closePath();
        return this;        
      },
      /**
       * Draws a filled rectangle.
       * @param {Number} x
       * @param {Number} y
       * @param {Number} width
       * @param {Number} height
       * @return jSketch
       * @name fillRect
       * @methodOf jSketch
       */
      fillRect: function(x,y,width,height) {
        this.graphics.beginPath();
        this.graphics.fillRect(x,y,width,height);
        this.graphics.closePath();
        return this;
      },
      /**
       * Draws a stroke-only circle.
       * @param {Number} x
       * @param {Number} y
       * @param {Number} radius
       * @return jSketch
       * @name strokeCircle
       * @methodOf jSketch
       */
      strokeCircle: function(x,y,radius) {
        this.graphics.beginPath();
        this.graphics.arc(x,y, radius, 0, Math.PI * 2, false);
        this.graphics.stroke();
        this.graphics.closePath();
        return this;
      },      
      /**
       * Draws a filled circle.
       * @param {Number} x
       * @param {Number} y
       * @param {Number} radius
       * @return jSketch
       * @name fillCircle
       * @methodOf jSketch
       */
      fillCircle: function(x,y,radius) {
        this.graphics.beginPath();
        this.graphics.arc(x,y, radius, 0, Math.PI * 2, false);
        this.graphics.fill();
        this.graphics.closePath();
        return this;
      },
      // experimental
      radialCircle: function(x,y,radius,color,glowSize){
        var g = this.graphics.createRadialGradient(x,y,radius,x,y,glowSize);
        g.addColorStop(0,color);
        g.addColorStop(1.0,"rgba(0,0,0,0)");
        this.graphics.fillStyle = g;
        this.fillCircle(x,y,radius);
        return this;
      },
      /**
       * A path is started.
       * @return jSketch
       * @name beginPath
       * @methodOf jSketch
       */
      beginPath: function() {
        this.graphics.beginPath();
        return this;
      },
      /**
       * A path is finished.
       * @return jSketch
       * @name closePath
       * @methodOf jSketch
       */
      closePath: function() {
        this.graphics.closePath();
        return this;
      },
      /**
       * Sets brush to eraser mode.
       * @return jSketch
       * @name eraser
       * @methodOf jSketch
       */
      eraser: function() {
        this.data.strokeStyle = this.graphics.strokeStyle;
        this.graphics.globalCompositeOperation = "copy";
        this.graphics.strokeStyle = "rgba(0,0,0,0)";
      },
      /**
       * Sets brush to pencil mode.
       * @return jSketch
       * @name pencil
       * @methodOf jSketch
       */
      pencil: function() {
        this.graphics.globalCompositeOperation = "source-over";
        this.graphics.strokeStyle = this.data.strokeStyle;
      },      
      /**
       * Clears stage.
       * @return jSketch
       * @name clear
       * @methodOf jSketch
       */
      clear: function() {
        this.graphics.clearRect(0,0, this.stageWidth,this.stageHeight);
        //this.canvas.width = this.canvas.width;
        this.data = {};
        return this;
      },
      /**
       * Saves a snapshot of all styles and transformations.
       * @return jSketch
       * @name save
       * @methodOf jSketch
       */
      save: function() {
        this.graphics.save();
        return this;
      },
      /**
       * Restores previous drawing state.
       * @return jSketch
       * @name restore
       * @methodOf jSketch
       */
      restore: function() {
        this.graphics.restore();
        return this;
      }
    };

    // expose
    window.jSketch = jSketch;
    
})(this);
