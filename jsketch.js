/*!
 * jSketch 0.9 | Luis A. Leiva | MIT license
 * A simple JavaScript library for drawing facilities on HTML5 canvas.
 */

/**
 * A simple JavaScript library for drawing facilities on HTML5 canvas.
 * This class is mostly a wrapper for the HTML5 canvas API with some syntactic sugar,
 * such as function chainability and old-school AS3-like notation.
 * @name jSketch
 * @class
 * @version 0.9
 * @author Luis A. Leiva
 * @license MIT license
 * @example
 * var canvas1 = document.getElementById('foo');
 * var canvas2 = document.getElementById('bar');
 * // Instantiate once, reuse everywhere.
 * var brush = new jSketch(canvas1).lineStyle('red').moveTo(50,50).lineTo(10,10).stroke();
 * // Actually, `.moveTo(50,50).lineTo(10,10)` can be just `.line(50,50, 10,10)`.
 * // Switching between contexts removes the need of having to reinstantiate the jSketch class.
 * brush.context(canvas2).beginFill('#5F7').fillCircle(30,30,8).endFill();
 */
;(function(window) {
    /**
     * @constructor
     * @param {Object} elem - MUST be a DOM element
     * @param {Object} options - Configuration
     */
    var jSketch = function(elem, options) {
      return new Sketch(elem, options);
    };
    // Base class, private.
    var Sketch = function(elem, options) {
      // Although discouraged, we can instantiate the class without arguments.
      if (!elem) return;
      // Set drawing context first.
      this.context(elem);
      // Scene defaults.
      this.stageWidth  = elem.width;
      this.stageHeight = elem.height;
      // Make room for storing some data such as brush type, colors, etc.
      this.data = {};
      // Set drawing defaults.
      this.drawingDefaults(options);
      // Make constructor chainable.
      return this;
    };
   /**
    * jSketch methods (publicly extensible).
    * @ignore
    * @memberof jSketch
    * @see jSketch
    */
    jSketch.fn = Sketch.prototype = {
      /**
       * Allows to change the drawing context at runtime.
       * @param {Object} elem - DOM element.
       * @return jSketch
       * @memberof jSketch
       */
      context: function(elem) {
        if (elem === null) throw('No canvas element specified.');
        // Save shortcuts: canvas (DOM elem) & graphics (2D canvas context).
        this.canvas = elem;
        this.graphics = elem.getContext('2d');
        // Always allow chainability.
        return this;
      },
      /**
       * Sets drawing defaults.
       * @param {Object} [options] - Drawing options.
       * @param {String} options.fillStyle - Fill style color (default: '#F00').
       * @param {String} options.strokeStyle - Stroke style color (default: '#F0F').
       * @param {Number} options.lineWidth - Line width (default: 2).
       * @param {String} options.lineCap - Line cap (default: 'round').
       * @param {String} options.lineJoin - Line join (default: 'round').
       * @param {Number} options.miterLimit - Line miter (default: 10). Works only if the lineJoin attribute is "miter".
       * @return jSketch
       * @memberof jSketch
       */
      drawingDefaults: function(options) {
        if (typeof options === 'undefined') options = {};
        if (typeof options.fillStyle   === 'undefined') options.fillStyle   = '#F00';
        if (typeof options.strokeStyle === 'undefined') options.strokeStyle = '#F0F';
        if (typeof options.lineWidth   === 'undefined') options.lineWidth   = 2;
        if (typeof options.lineCap     === 'undefined') options.lineCap     = 'round';
        if (typeof options.lineJoin    === 'undefined') options.lineJoin    = 'round';
        if (typeof options.miterLimit  === 'undefined') options.miterLimit  = 10;
        // Remember graphic options for later saving/restoring drawing status.
        this.saveGraphics(options);
        // Apply defaults.
        this.restoreGraphics();
        return this;
      },
      /**
       * Sets the dimensions of canvas.
       * @param {Number} width - New canvas width.
       * @param {Number} height - New canvas width.
       * @return jSketch
       * @memberof jSketch
       */
      size: function(width, height) {
        this.stageWidth  = width;
        this.stageHeight = height;
        this.canvas.width  = width;
        this.canvas.height = height;
        // On resizing we lose drawing options, so restore them.
        this.restoreGraphics();
        return this;
      },
      /**
       * Sets the background color of canvas.
       * @param {String} color - An HTML color.
       * @return jSketch
       * @memberof jSketch
       */
      background: function(color) {
        this.beginFill(color);
        this.graphics.fillRect(0,0, this.stageWidth,this.stageHeight);
        this.endFill();
        return this;
      },
      /**
       * Shortcut for setting the size + background color.
       * @param {Number} width - New canvas width.
       * @param {Number} height - New canvas width.
       * @param {String} bgcolor - An HTML color.
       * @return jSketch
       * @memberof jSketch
       */
      stage: function(width, height, bgcolor) {
        this.size(width,height).background(bgcolor);
        return this;
      },
      /**
       * Sets the fill color.
       * @param {String} color - An HTML color.
       * @return jSketch
       * @memberof jSketch
       */
      beginFill: function(color) {
        this.saveGraphics();
        this.graphics.fillStyle = color;
        return this;
      },
      /**
       * Recovers the fill color that was set before <code>beginFill()</code>.
       * @return jSketch
       * @memberof jSketch
       */
      endFill: function() {
        this.restoreGraphics();
        return this;
      },
      /**
       * Sets the line style.
       * @param {String} color - An HTML color.
       * @param {Number} thickness - Line thickness.
       * @param {String} capStyle - Style of line cap.
       * @param {String} joinStyle - Style of line join.
       * @param {String} miter - Style of line miter. Only works if capStyle is "miter".
       * @return jSketch
       * @memberof jSketch
       */
      lineStyle: function(color, thickness, capStyle, joinStyle, miter) {
        var options = {
          strokeStyle: color     || this.graphics.strokeStyle,
          lineWidth:   thickness || this.graphics.lineWidth,
          lineCap:     capStyle  || this.graphics.lineCap,
          lineJoin:    joinStyle || this.graphics.lineJoin,
          miterLimit:  miter     || this.graphics.miterLimit
        };
        this.saveGraphics(options);
        this.restoreGraphics();
        return this;
      },
      /**
       * Move brush to a coordinate in canvas.
       * @param {Number} x - Horizontal coordinate.
       * @param {Number} y - Vertical coordinate.
       * @return jSketch
       * @memberof jSketch
       */
      moveTo: function(x, y) {
        this.graphics.moveTo(x,y);
        return this;
      },
      /**
       * Draws line to given coordinate.
       * @param {Number} x - Horizontal coordinate.
       * @param {Number} y - Vertical coordinate.
       * @return jSketch
       * @memberof jSketch
       */
      lineTo: function(x, y) {
        this.graphics.lineTo(x,y);
        return this;
      },
      /**
       * Draws line from point 1 to point 2.
       * @param {Number} x1 - Horizontal coordinate of point 1.
       * @param {Number} y1 - Vertical coordinate of point 1.
       * @param {Number} x2 - Horizontal coordinate of point 2.
       * @param {Number} y2 - Vertical coordinate of point 2.
       * @return jSketch
       * @memberof jSketch
       */
      line: function(x1,y1, x2,y2) {
        this.graphics.moveTo(x1,y1);
        this.lineTo(x2,y2);
        return this;
      },
      /**
       * Draws curve to given coordinate.
       * @param {Number} x - Horizontal coordinate.
       * @param {Number} y - Vertical coordinate.
       * @param {Number} cpx - Horizontal coordinate of control point.
       * @param {Number} cpy - Vertical coordinate of control point.
       * @return jSketch
       * @memberof jSketch
       */
      curveTo: function(x,y, cpx,cpy) {
        this.graphics.quadraticCurveTo(cpx,cpy, x,y);
        return this;
      },
      /**
       * Draws curve from coordinate 1 to coordinate 2.
       * @param {Number} x1 - Horizontal coordinate of point 1.
       * @param {Number} y1 - Vertical coordinate of point 1.
       * @param {Number} x2 - Horizontal coordinate of point 2.
       * @param {Number} y2 - Vertical coordinate of point 2.
       * @param {Number} cpx - Horizontal coordinate of control point.
       * @param {Number} cpy - Vertical coordinate of control point.
       * @return jSketch
       * @memberof jSketch
       */
      curve: function(x1,y1, x2,y2, cpx,cpy) {
        this.graphics.moveTo(x1,y1);
        this.curveTo(x2,y2, cpx,cpy);
        return this;
      },
      /**
       * Strokes a given path.
       * @return jSketch
       * @memberof jSketch
       */
      stroke: function() {
        this.graphics.stroke();
        return this;
      },
      /**
       * Draws a stroke-only rectangle.
       * @param {Number} x - Horizontal coordinate.
       * @param {Number} y - Vertical coordinate.
       * @param {Number} width - Rectangle width.
       * @param {Number} height - Rectangle height.
       * @return jSketch
       * @memberof jSketch
       */
      strokeRect: function(x,y, width,height) {
        this.graphics.beginPath();
        this.graphics.strokeRect(x,y, width,height);
        this.graphics.closePath();
        return this;
      },
      /**
       * Draws a filled rectangle.
       * @param {Number} x - Horizontal coordinate.
       * @param {Number} y - Vertical coordinate.
       * @param {Number} width - Rectangle width.
       * @param {Number} height - Rectangle height.
       * @return jSketch
       * @memberof jSketch
       */
      fillRect: function(x,y, width,height) {
        this.graphics.beginPath();
        this.graphics.fillRect(x,y, width,height);
        this.graphics.closePath();
        return this;
      },
      /**
       * Draws a stroke-only circle.
       * @param {Number} x - Horizontal coordinate.
       * @param {Number} y - Vertical coordinate.
       * @param {Number} radius - Circle radius.
       * @return jSketch
       * @memberof jSketch
       */
      strokeCircle: function(x,y, radius) {
        this.graphics.beginPath();
        this.graphics.arc(x,y, radius, 0, 2*Math.PI, false);
        this.graphics.stroke();
        this.graphics.closePath();
        return this;
      },
      /**
       * Draws a filled circle.
       * @param {Number} x - Horizontal coordinate.
       * @param {Number} y - Vertical coordinate.
       * @param {Number} radius - Circle radius.
       * @return jSketch
       * @memberof jSketch
       */
      fillCircle: function(x,y, radius) {
        this.graphics.beginPath();
        this.graphics.arc(x,y, radius, 0, 2*Math.PI, false);
        this.graphics.fill();
        this.graphics.closePath();
        return this;
      },
      /**
       * Experimental.
       * @ignore
       */
      radialCircle: function(x,y, radius, glowSize, colors) {
        var g = this.graphics.createRadialGradient(x,y, radius, x,y, glowSize || 5);
        if (!colors || colors.constructor.name !== 'array') {
          colors = [this.graphics.fillStyle, 'white'];
        }
        for (var s = 0; s < colors.length; s++) {
          var color = colors[s];
          g.addColorStop(s, color);
        }
        this.beginFill(g).fillCircle(x,y, radius).endFill();
        return this;
      },
      /**
       * A path is started.
       * @return jSketch
       * @memberof jSketch
       */
      beginPath: function() {
        this.saveGraphics();
        this.graphics.beginPath();
        return this;
      },
      /**
       * A path is finished.
       * @return jSketch
       * @memberof jSketch
       */
      closePath: function() {
        this.graphics.closePath();
        this.restoreGraphics();
        return this;
      },
      /**
       * Sets brush to eraser mode.
       * @param {Number} [brushSize] - Brush size. Default: 15.
       * @return jSketch
       * @memberof jSketch
       */
      eraser: function(brushSize) {
        if (typeof brushSize === 'undefined') brushSize = 15;
        this.graphics.globalCompositeOperation = 'destination-out';
        this.lineStyle(null, brushSize);
        return this;
      },
      /**
       * Sets brush to pencil mode.
       * @param {Number} [brushSize] - Brush size. Default: 2.
       * @return jSketch
       * @memberof jSketch
       */
      pencil: function(brushSize) {
        if (typeof brushSize === 'undefined') brushSize = 2;
        this.graphics.globalCompositeOperation = 'source-over';
        this.lineStyle(null, brushSize);
        return this;
      },
      /**
       * Clears stage.
       * @return jSketch
       * @memberof jSketch
       */
      clear: function() {
        // Note: using 'this.canvas.width = this.canvas.width' resets _all_ styles, so better use clearRect.
        this.graphics.clearRect(0,0, this.stageWidth,this.stageHeight);
        return this;
      },
      /**
       * Saves a snapshot of all styles and transformations.
       * @return jSketch
       * @memberof jSketch
       */
      save: function() {
        this.graphics.save();
        return this;
      },
      /**
       * Restores previous drawing state.
       * @return jSketch
       * @memberof jSketch
       */
      restore: function() {
        this.graphics.restore();
        return this;
      },
      /**
       * Saves given drawing settings.
       * @param {Object} [options] - Graphics options.
       * @return jSketch
       * @memberof jSketch
       */
      saveGraphics: function(options) {
        if (typeof options !== 'undefined') this.data.options = options;
        return this;
      },
      /**
       * Restores given drawing settings.
       * @param {Object} [options] - Graphics options.
       * @return jSketch
       * @memberof jSketch
       */
      restoreGraphics: function(options) {
        if (typeof options === 'undefined') options = this.data.options;
        for (var opt in options) {
          this.graphics[opt] = options[opt];
        }
        return this;
      },
      /**
       * Draws an image.
       * @param {String} src - Image source path.
       * @param {Number} [x] - Horizontal coordinate.
       * @param {Number} [y] - Vertical coordinate.
       * @return jSketch
       * @memberof jSketch
       */
      drawImage: function(src, x,y) {
        if (typeof x === 'undefined') x = 0;
        if (typeof y === 'undefined') y = 0;
        var self = this, img = new Image();
        img.src = src;
        img.onload = function() {
          self.graphics.drawImage(img, x,y);
        }
        return this;
      }
    };

    // Expose.
    window.jSketch = jSketch;

})(this);
