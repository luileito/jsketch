/*!
 * An animation plugin for jQuery Sketchable | v1.0 | Luis A. Leiva | MIT license
 */

/* eslint-env browser */
/* global jQuery */
;(function($) {

  // Custom namespace ID, for private data bindind.
  var namespace = 'sketchable';

  /**
   * Brings animation capabilities to Sketchable elements.
   * @class
   * @version 1.0
   * @param {jQuery} $instance - jQuery sketchable element.
   */
  function AnimateSketch($instance) {
    var self = this;
    var data = $instance.data(namespace);

    // Note: requires strokes to be set in advance.
    var sketch   = data.sketch;
    var strokes  = data.strokes;
    var events   = data.options.events;
    var graphics = data.options.graphics;

    var fmtStrokes = [];
    var pointCount = 0;
    for (var s = 0; s < strokes.length; s++) {
      var fmtCoords = [];
      var coords = strokes[s];
      for (var c = 0; c < coords.length; c++) {
        // Add strokeId to easily handle multistrokes.
        var pt = toPoint(coords[c]);
        pt.strokeId = s;
        fmtCoords.push(pt);
        pointCount++;
      }
      fmtStrokes.push(fmtCoords);
    }

    if (typeof events.animationstart === 'function') {
      events.animationstart($instance, data);
    }

    var raf = {}; // Trigger one animation per stroke.
    var pts = 1;  // Will reach the total number of points.

    for (var s = 0; s < fmtStrokes.length; s++) {
      (function(s) {
        var coords = fmtStrokes[s];
        var frame = 0;

        (function loop() {
          raf[s] = requestAnimationFrame(loop);
          try {
            drawLine(sketch, coords, frame, graphics);
          } catch (err) {
            console.error(err);
            cancelAnimationFrame(raf[s]);
          }
          // Advance local count and check if current animation should end.
          if (++frame === coords.length - 1) {
            cancelAnimationFrame(raf[s]);
          }
          // Advance global count and check if actual animation has ended.
          if (++pts === pointCount - 1 && typeof events.animationend === 'function') {
            events.animationend($instance, data);
          }
        })();

      })(s);
    }

    /**
     * Cancel current animation.
     * @return {AnimateSketch}.
     */
    this.cancel = function() {
      for (var s in raf) {
        cancelAnimationFrame(raf[s]);
      }
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
      var currPt = coords[t];
      var nextPt = coords[t + 1];

      if (sketch.data.firstPointSize && (t === 1 || currPt.strokeId !== nextPt.strokeId)) {
        var pt = t > 1 ? nextPt : currPt;
        sketch.beginFill(sketch.data.strokeStyle).fillCircle(pt.x, pt.y, sketch.data.firstPointSize);
      }

      sketch.lineStyle(graphics.strokeStyle, graphics.lineWidth).beginPath();
      if (currPt.strokeId === nextPt.strokeId) {
        sketch.line(currPt.x, currPt.y, nextPt.x, nextPt.y).stroke();
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
   * @param {jQuery} $instance - jQuery Sketchable instance.
   * @namespace $.fn.sketchable.plugins.animate
   */
  $.fn.sketchable.plugins.animate = function($instance) {
    // Access the instance configuration.
    var config = $instance.sketchable('config');

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
          fn.apply($instance, arguments);
          callbacks[evName].apply($instance, arguments);
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

    // Expose public API: all jQuery sketchable instances will have these methods.
    $.extend($.fn.sketchable.api, {
      // Namespace methods to avoid collisions with other plugins.
      animate: {
        /**
         * Animate canvas strokes.
         * @return {jQuery} jQuery sketchable element.
         * @memberof $.fn.sketchable.plugins.animate
         * @example jqueryElem.sketchable('strokes', strokesArray).sketchable('animate.strokes');
         * @example
         * // Accessing event hooks:
         * jqueryElem.sketchable('config', {
         *   events: {
         *     animationstart: function(elem, data) {
         *       // Animation started.
         *     },
         *     animationend: function(elem, data) {
         *       // Animation ended.
         *     },
         *   }
         * })
         * .sketchable('strokes', strokesArray)
         * .sketchable('animate.strokes');
         */
        strokes: function() {
          var data = $(this).data(namespace);
          data.animate = new AnimateSketch($instance);
          return $instance;
        },
      },
    });

  };

})(jQuery);
