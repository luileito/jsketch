/*!
 * SVG plugin for Sketchable | v1.0 | Luis A. Leiva | MIT license
 */

// XXX: Requires `sketchable.utils.js` to be loaded first.

/* eslint-env browser */
/* global Event, dataBind, deepExtend */
;(function(window) {

  // Custom namespace ID, for private data bindind.
  var namespace = 'sketchable';
  /**
   * SVG plugin constructor for Sketchable instances.
   * @param {Sketchable} instance - Sketchable element.
   * @namespace Sketchable.plugins.svg
   */
  Sketchable.prototype.plugins.svg = function(instance) {
    var callbacks = {
      clear: function(elem, data) {
        data.sketch.callStack = [];
      },
      destroy: function(elem, data) {
        data.sketch.callStack = [];
      },
    };

    // Note: the init event is used to create sketchable instances,
    // therefore it should NOT be overriden.
    var events = 'clear destroy'.split(' ');
    for (var i = 0; i < events.length; i++) {
      var evName = events[i];
      instance.decorate(evName, callbacks[evName], 'svg');
    }

    // Expose public API: all Sketchable instances will have these methods.
    deepExtend(instance, {
      // Namespace methods to avoid collisions with other plugins.
      svg: {
        /**
         * Generate SVG.
         * @param {function} callback - Callback function, executed with the SVG (string) as argument.
         * @return {Sketchable} Sketchable element.
         * @memberof Sketchable.plugins.svg
         * @example
         * sketchableInstance.svg.create(function(contents) {
         *   // Do something with the SVG string.
         * });
         */
        create: function(callback) {
          var data = dataBind(instance.elem)[namespace];
          data.sketch.toSVG(callback);
          return instance;
        },
      },
    });
  };

})(this);
