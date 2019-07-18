/*!
 * Animation plugin for Sketchable | v1.0 | Luis A. Leiva | MIT license
 */

// XXX: Requires `sketchable.utils.js` to be loaded first.

/* eslint-env browser */
/* global Event, dataBind, deepExtend */
;(function(window) {

  // Custom namespace ID, for private data bindind.
  var namespace = 'sketchable';

  /**
   * Brings animation capabilities to Sketchable elements.
   * @class
   * @version 1.0
   * @param {Sketchable} instance - Sketchable element.
   */
  function AnimateSketch(instance) {
    var self = this;
    var data = dataBind(instance.elem)[namespace];

    // Note: To animate a sketchable canvas, strokes must be set in advance.
    var sketch   = data.sketch;
    var strokes  = data.strokes;
    var events   = data.options.events;
    var graphics = data.options.graphics;

    // Reformat strokes to handle multitouch.
    var fmtStrokes = [];
    for (var s = 0; s < strokes.length; s++) {
      var coords = strokes[s];
      for (var c = 0; c < coords.length; c++) {
        var pt = toPoint(coords[c]);
        // The strokeId is not available in jsketchable < 2.2, so add it.
        if (!pt.strokeId) pt.strokeId = s;
        fmtStrokes.push(pt);
      }
    }

    if (typeof events.animationstart === 'function')
      events.animationstart(instance, data);

    var raf;
    var frame = 0;

    sketch.lineStyle(graphics.strokeStyle, graphics.lineWidth);

    (function loop() {
      raf = requestAnimationFrame(loop);
      // Here be dragons, thus surround by try/catch.
      try {
        drawLine(sketch, fmtStrokes, frame, graphics);
      } catch (err) {
        console.error(err);
        cancelAnimationFrame(raf);
      }
      // Advance local count and check if current animation should end.
      if (++frame === fmtStrokes.length - 1) {
        cancelAnimationFrame(raf);
        if (typeof events.animationend === 'function')
          events.animationend(instance, data);
      }
    })();

    /**
     * Cancel current animation.
     * @return {AnimateSketch}.
     */
    this.cancel = function() {
      cancelAnimationFrame(raf);
      return this;
    };

    /**
     * Draw line on jSketch canvas at time t.
     * @private
     * @param {object} sketch - jSketch canvas.
     * @param {array} coords - Stroke coordinates.
     * @param {number} t - Time iterator.
     */
    function drawLine(sketch, coords, t) {
      var currPt = coords[t];
      var nextPt = coords[t + 1];

      if (t === 0 || currPt.strokeId !== nextPt.strokeId) {
        // Draw first point.
        if (sketch.data.firstPointSize) {
          var pt = t > 0 ? nextPt : currPt;
          sketch.beginFill(sketch.data.strokeStyle)
            .fillCircle(pt.x, pt.y, sketch.data.firstPointSize)
            .endFill();
        }
        // Trigger step event for subsequent strokes.
        if (t > 0 && typeof events.animationstep === 'function')
          events.animationstep(instance, data);
        // Flag stroke change.
        sketch.closePath().beginPath();
      }

      if (currPt.strokeId === nextPt.strokeId)
        sketch.line(currPt.x, currPt.y, nextPt.x, nextPt.y).stroke();
    }

    /**
     * Convert point array to object.
     * @private
     * @param {array} p - Point, having at least [x,y,t] items.
     * @return {object}
     */
    function toPoint(p) {
      if (!(p instanceof Array)) return p;
      // Point coords is an array with 4 items: [x, y, time, is_drawing, strokeId].
      return { x: p[0], y: p[1], time: p[2], strokeId: p[4] };
    }
  }

  /**
   * Animate plugin constructor for jQuery Sketchable instances.
   * @param {Sketchable} instance - Sketchable element.
   * @namespace Sketchable.plugins.animate
   */
  Sketchable.prototype.plugins.animate = function(instance) {
    var callbacks = {
      clear: function(elem, data) {
        data.animate && data.animate.cancel();
      },
      destroy: function(elem, data) {
        data.animate && data.animate.cancel();
      },
    };

    // Note: the init event is used to create sketchable instances,
    // therefore it should NOT be overriden.
    var events = 'clear destroy'.split(' ');
    for (var i = 0; i < events.length; i++) {
      var evName = events[i];
      instance.decorate(evName, callbacks[evName], 'animate');
    }

    // Expose public API: all Sketchable instances will have these methods.
    deepExtend(instance, {
      // Namespace methods to avoid collisions with other plugins.
      animate: {
        /**
         * Animate canvas strokes.
         * @return {Sketchable} Sketchable element.
         * @memberof Sketchable.plugins.animate
         * @example sketchableInstance.strokes(strokeArray).animate.strokes();
         * @example
         * // Accessing event hooks:
         * sketchableInstance.config({
         *   events: {
         *     animationstart: function(elem, data) {
         *       // Animation started: the first stroke is being drawn.
         *     },
         *     animationstep: function(elem, data) {
         *       // Animation steped: a new stroke is being drawn.
         *     },
         *     animationend: function(elem, data) {
         *       // Animation ended: the last stroke has been drawn.
         *     },
         *   }
         * })
         * .strokes(strokeArray)
         * .animate.strokes();
         */
        strokes: function() {
          var data = dataBind(instance.elem)[namespace];
          data.animate = new AnimateSketch(instance);
          return instance;
        },
      },
    });

  };

})(this);
