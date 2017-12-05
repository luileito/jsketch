/*!
 * jSketch 1.0 | Luis A. Leiva | MIT license
 * A simple JavaScript library for drawing facilities on HTML5 canvas.
 */

/**
 * A simple JavaScript library for drawing facilities on HTML5 canvas.
 * This class is mostly a wrapper for the HTML5 canvas API with some syntactic sugar,
 * such as function chainability and old-school AS3-like notation.
 * @name jSketch
 * @class
 * @version 1.0
 * @author Luis A. Leiva
 * @license MIT license
 * @example
 * var canvas1 = document.getElementById('foo');
 * var canvas2 = document.getElementById('bar');
 * // Instantiate once, reuse everywhere.
 * var brush = new jSketch(canvas1).lineStyle('red').moveTo(50,50).lineTo(10,10).stroke();
 * // Actually, `.moveTo(50,50).lineTo(10,10)` can be just `.line(50,50, 10,10)`.
 * // Switching between contexts removes the need of having to reinstantiate the jSketch class.
 * brush.setContext(canvas2).beginFill('#5F7').fillCircle(30,30,8).endFill();
 */
;(function(window) {
  /**
   * @constructor
   * @param {object|strig} elem - DOM element or selector.
   * @param {object} [options] - Configuration (default: {@link Sketchable#defaults}).
   */
  function jSketch(elem, options) {
    if (!elem) throw new Error('Sketchable requires a DOM element.');
    if (typeof elem === 'string') elem = document.querySelector(elem);
    // Set drawing context first.
    this.setContext(elem);
    // Scene defaults.
    this.stageWidth  = elem.width;
    this.stageHeight = elem.height;
    // Make room for storing some data such as line type, colors, etc.
    this.data = options;
    // Set drawing defaults.
    // All methods are chainable.
    return this.setDefaults();
  };
  /**
   * jSketch methods (publicly extensible).
   * @ignore
   * @memberof jSketch
   * @see jSketch
   */
  jSketch.prototype = {
    /**
     * Allows to change the drawing context at runtime.
     * @param {object} elem - DOM element.
     * @return jSketch
     * @memberof jSketch
     */
    setContext: function(elem) {
      if (!elem) throw new Error('No canvas element specified.');
      // Save shortcuts: canvas (DOM elem) & graphics (2D canvas context).
      this.canvas = elem;
      this.context = elem.getContext('2d');
      // Always allow chainability.
      return this;
    },
    /**
     * Sets drawing defaults:
     * - fillStyle: Fill style color ('#F00').
     * - strokeStyle: Stroke style color ('#F0F').
     * - lineWidth: Line width (2).
     * - lineCap: Line cap ('round').
     * - lineJoin: Line join ('round').
     * - miterLimit: Line miter (10). Works only if the lineJoin attribute is "miter".
     * @return jSketch
     * @memberof jSketch
     */
    setDefaults: function() {
      return this.saveGraphics({
        fillStyle: this.data.fillStyle || '#F00',
        strokeStyle: this.data.strokeStyle || '#F0F',
        lineWidth: this.data.lineWidth || 2,
        lineCap: this.data.lineCap || 'round',
        lineJoin: this.data.lineJoin || 'round',
        miterLimit: this.data.miterLimit || 10,
      }).restoreGraphics();
    },
    /**
     * Sets the dimensions of canvas.
     * @param {number} width - New canvas width.
     * @param {number} height - New canvas width.
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
     * @param {string} color - An HTML color.
     * @return jSketch
     * @memberof jSketch
     */
    background: function(color) {
      this.beginFill(color);
      this.context.fillRect(0, 0, this.stageWidth, this.stageHeight);
      this.endFill();
      return this;
    },
    /**
     * Shortcut for setting the size + background color.
     * @param {number} width - New canvas width.
     * @param {number} height - New canvas width.
     * @param {string} bgcolor - An HTML color.
     * @return jSketch
     * @memberof jSketch
     */
    stage: function(width, height, bgcolor) {
      this.size(width, height).background(bgcolor);
      return this;
    },
    /**
     * Sets the fill color.
     * @param {string} color - An HTML color.
     * @return jSketch
     * @memberof jSketch
     */
    beginFill: function(color) {
      this.saveGraphics();
      this.context.fillStyle = color;
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
     * @param {string} color - An HTML color.
     * @param {number} thickness - Line thickness.
     * @param {string} capStyle - Style of line cap.
     * @param {string} joinStyle - Style of line join.
     * @param {string} miter - Style of line miter. Only works if capStyle is "miter".
     * @return jSketch
     * @memberof jSketch
     */
    lineStyle: function(color, thickness, capStyle, joinStyle, miter) {
      return this.saveGraphics({
        strokeStyle: color     || this.data.strokeStyle,
        lineWidth: thickness || this.data.lineWidth,
        lineCap: capStyle  || this.data.lineCap,
        lineJoin: joinStyle || this.data.lineJoin,
        miterLimit: miter     || this.data.miterLimit,
      }).restoreGraphics();
    },
    /**
     * Move brush to a coordinate in canvas.
     * @param {number} x - Horizontal coordinate.
     * @param {number} y - Vertical coordinate.
     * @return jSketch
     * @memberof jSketch
     */
    moveTo: function(x, y) {
      this.context.moveTo(x, y);
      return this;
    },
    /**
     * Draws line to given coordinate.
     * @param {number} x - Horizontal coordinate.
     * @param {number} y - Vertical coordinate.
     * @return jSketch
     * @memberof jSketch
     */
    lineTo: function(x, y) {
      this.context.lineTo(x, y);
      return this;
    },
    /**
     * Draws line from point 1 to point 2.
     * @param {number} x1 - Horizontal coordinate of point 1.
     * @param {number} y1 - Vertical coordinate of point 1.
     * @param {number} x2 - Horizontal coordinate of point 2.
     * @param {number} y2 - Vertical coordinate of point 2.
     * @return jSketch
     * @memberof jSketch
     */
    line: function(x1, y1, x2, y2) {
      this.context.moveTo(x1, y1);
      this.lineTo(x2, y2);
      return this;
    },
    /**
     * Draws curve to given coordinate.
     * @param {number} x - Horizontal coordinate.
     * @param {number} y - Vertical coordinate.
     * @param {number} cpx - Horizontal coordinate of control point.
     * @param {number} cpy - Vertical coordinate of control point.
     * @return jSketch
     * @memberof jSketch
     */
    curveTo: function(x, y, cpx, cpy) {
      this.context.quadraticCurveTo(cpx, cpy, x, y);
      return this;
    },
    /**
     * Draws curve from coordinate 1 to coordinate 2.
     * @param {number} x1 - Horizontal coordinate of point 1.
     * @param {number} y1 - Vertical coordinate of point 1.
     * @param {number} x2 - Horizontal coordinate of point 2.
     * @param {number} y2 - Vertical coordinate of point 2.
     * @param {number} cpx - Horizontal coordinate of control point.
     * @param {number} cpy - Vertical coordinate of control point.
     * @return jSketch
     * @memberof jSketch
     */
    curve: function(x1, y1, x2, y2, cpx, cpy) {
      this.context.moveTo(x1, y1);
      this.curveTo(x2, y2, cpx, cpy);
      return this;
    },
    /**
     * Strokes a given path.
     * @return jSketch
     * @memberof jSketch
     */
    stroke: function() {
      this.context.stroke();
      return this;
    },
    /**
     * Draws a stroke-only rectangle.
     * @param {number} x - Horizontal coordinate.
     * @param {number} y - Vertical coordinate.
     * @param {number} width - Rectangle width.
     * @param {number} height - Rectangle height.
     * @return jSketch
     * @memberof jSketch
     */
    strokeRect: function(x, y, width, height) {
      this.context.beginPath();
      this.context.strokeRect(x, y, width, height);
      this.context.closePath();
      return this;
    },
    /**
     * Draws a filled rectangle.
     * @param {number} x - Horizontal coordinate.
     * @param {number} y - Vertical coordinate.
     * @param {number} width - Rectangle width.
     * @param {number} height - Rectangle height.
     * @return jSketch
     * @memberof jSketch
     */
    fillRect: function(x, y, width, height) {
      this.context.beginPath();
      this.context.fillRect(x, y, width, height);
      this.context.closePath();
      return this;
    },
    /**
     * Draws a stroke-only circle.
     * @param {number} x - Horizontal coordinate.
     * @param {number} y - Vertical coordinate.
     * @param {number} radius - Circle radius.
     * @return jSketch
     * @memberof jSketch
     */
    strokeCircle: function(x, y, radius) {
      this.context.beginPath();
      this.context.arc(x, y, radius, 0, 2*Math.PI, false);
      this.context.stroke();
      this.context.closePath();
      return this;
    },
    /**
     * Draws a filled circle.
     * @param {number} x - Horizontal coordinate.
     * @param {number} y - Vertical coordinate.
     * @param {number} radius - Circle radius.
     * @return jSketch
     * @memberof jSketch
     */
    fillCircle: function(x, y, radius) {
      this.context.beginPath();
      this.context.arc(x, y, radius, 0, 2*Math.PI, false);
      this.context.fill();
      this.context.closePath();
      return this;
    },
    /**
     * Experimental.
     * @ignore
     */
    radialCircle: function(x, y, radius, glowSize, colors) {
      if (typeof glowSize === 'undefined' || glowSize < 0) glowSize = 1;
      var g = this.context.createRadialGradient(x, y, radius, x, y, glowSize);
      if (!colors || colors.constructor.name.toLowerCase() !== 'array') {
        colors = [this.context.fillStyle, 'white'];
      }
      for (var s = 0; s < colors.length; s++) {
        var color = colors[s];
        g.addColorStop(s, color);
      }
      this.beginFill(g).fillCircle(x, y, radius).endFill();
      return this;
    },
    /**
     * A path is started.
     * @return jSketch
     * @memberof jSketch
     */
    beginPath: function() {
      this.saveGraphics();
      this.context.beginPath();
      return this;
    },
    /**
     * A path is finished.
     * @return jSketch
     * @memberof jSketch
     */
    closePath: function() {
      this.context.closePath();
      this.restoreGraphics();
      return this;
    },
    /**
     * Sets brush to eraser mode.
     * @return jSketch
     * @memberof jSketch
     */
    eraser: function() {
      this.context.globalCompositeOperation = 'destination-out';
      return this;
    },
    /**
     * Sets brush to pencil mode.
     * @return jSketch
     * @memberof jSketch
     */
    pencil: function() {
      this.context.globalCompositeOperation = 'source-over';
      return this;
    },
    /**
     * Clears stage.
     * @return jSketch
     * @memberof jSketch
     */
    clear: function() {
      // Note: using 'this.canvas.width = this.canvas.width' resets _all_ styles, so better use clearRect.
      this.context.clearRect(0, 0, this.stageWidth, this.stageHeight);
      return this;
    },
    /**
     * Saves a snapshot of all styles and transformations.
     * @return jSketch
     * @memberof jSketch
     */
    save: function() {
      this.context.save();
      return this;
    },
    /**
     * Restores previous drawing state.
     * @return jSketch
     * @memberof jSketch
     */
    restore: function() {
      this.context.restore();
      return this;
    },
    /**
     * Saves given drawing settings.
     * @param {object} [options] - Graphics options.
     * @return jSketch
     * @memberof jSketch
     */
    saveGraphics: function(options) {
      for (var opt in options) {
        this.data[opt] = options[opt];
      }
      return this;
    },
    /**
     * Restores given drawing settings.
     * @return jSketch
     * @memberof jSketch
     */
    restoreGraphics: function() {
      for (var opt in this.data) {
        this.context[opt] = this.data[opt];
      }
      return this;
    },
    /**
     * Draws an image.
     * @param {string} src - Image source path.
     * @param {number} [x] - Horizontal coordinate.
     * @param {number} [y] - Vertical coordinate.
     * @return jSketch
     * @memberof jSketch
     */
    drawImage: function(src, x, y) {
      if (typeof x === 'undefined') x = 0;
      if (typeof y === 'undefined') y = 0;
      var self = this, img = new Image();
      img.src = src;
      img.onload = function() {
        self.context.drawImage(img, x, y);
      };
      return this;
    },
  };

  // Expose.
  window.jSketch = jSketch;

})(this);
