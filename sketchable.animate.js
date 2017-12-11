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

    // Note: requires strokes to be set in advance.
    var sketch   = data.sketch;
    var strokes  = data.strokes;
    var events   = data.options.events;
    var graphics = data.options.graphics;

    // Flatten strokes struct to easily handle multistrokes.
    var fmtStrokes = [];
    for (var s = 0; s < strokes.length; s++) {
      var coords = strokes[s];
      for (var c = 0; c < coords.length; c++) {
        var pt = toPoint(coords[c]);
        pt.strokeId = s;
        fmtStrokes.push(pt);
      }
    }

    var raf;
    var frame = 1;
    var count = fmtStrokes.length - 1;

    if (typeof events.animationstart === 'function') events.animationstart(instance.elem, data);

    (function loop() {
      raf = requestAnimationFrame(loop);

      try {
        drawLine(sketch, fmtStrokes, frame, graphics);
        frame++;
      } catch (err) {
        console.error(err);
        cancelAnimationFrame(raf);
      }

      if (frame == count) {
        cancelAnimationFrame(raf);
        if (typeof events.animationend === 'function') events.animationend(instance.elem, data);
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
     * Optionally set graphics options.
     * @private
     * @param {object} sketch - jSketch canvas.
     * @param {array} coords - Stroke coordinates.
     * @param {number} t - Time iterator.
     * @param {object} [graphics] - Graphics options.
     */
    function drawLine(sketch, coords, t, graphics) {
      var prevPt = coords[t - 1];
      var currPt = coords[t];

      if (sketch.data.firstPointSize && (t === 1 || currPt.strokeId !== prevPt.strokeId)) {
        var pt = t > 1 ? currPt : prevPt;
        sketch.beginFill(sketch.data.strokeStyle).fillCircle(pt.x, pt.y, sketch.data.firstPointSize);
      }

      sketch.lineStyle(graphics.strokeStyle, graphics.lineWidth).beginPath();
      if (currPt.strokeId === prevPt.strokeId) {
        sketch.line(prevPt.x, prevPt.y, currPt.x, currPt.y).stroke();
      }
      sketch.closePath();
    };

    /**
     * Convert point array to object.
     * @private
     * @param {array} p - Point, having at least [x,y,t] items.
     * @return {object}
     */
    function toPoint(p) {
      if (!(p instanceof Array)) return p;
      return { x: p[0], y: p[1], t: p[2] };
    };
  }

  /**
   * Animate plugin constructor for jQuery Sketchable instances.
   * @param {Sketchable} instance - Sketchable element.
   * @namespace Sketchable.plugins.animate
   */
  Sketchable.prototype.plugins.animate = function(instance) {
    // Access the instance configuration.
    var config = instance.config();

    var callbacks = {
      clear: function(elem, data) {
        data.animate && data.animate.cancel();
      },
      destroy: function(elem, data) {
        data.animate && data.animate.cancel();
      },
    };

    // A helper function to override user-defined event listeners.
    function override(evName) {
      // Flag event override so that it doesn't get fired more than once.
      if (config.options['_bound.animate$' + evName]) return;
      config.options['_bound.animate$' + evName] = true;

      if (config.options.events && typeof config.options.events[evName] === 'function') {
        // User has defined this event, so wrap it.
        var fn = config.options.events[evName];
        config.options.events[evName] = function() {
          // Exec original function first, then exec our callback.
          fn.apply(instance, arguments);
          callbacks[evName].apply(instance, arguments);
        };
      } else {
        // User has not defined this event, so attach our callback.
        config.options.events[evName] = callbacks[evName];
      }
    }

    // Note: the init event is used to create sketchable instances,
    // therefore it should NOT be overriden.
    var events = 'clear destroy'.split(' ');
    for (var i = 0; i < events.length; i++) {
      override(events[i]);
    }

    // Expose public API: all Sketchable instances will have these methods.
    deepExtend(instance, {
      // Namespace methods to avoid collisions with other plugins.
      animate: {
        /**
         * Animate canvas strokes.
         * @return {Sketchable} instance Sketchable element.
         * @memberof Sketchable.plugins.animate
         * @example sketchableInstance.strokes(strokeArray).animate.strokes();
         * @example
         * // Accessing event hooks:
         * sketchableInstance.config({
         *   events: {
         *     animationstart: function(elem, data) {
         *       // Animation started.
         *     },
         *     animationend: function(elem, data) {
         *       // Animation ended.
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
