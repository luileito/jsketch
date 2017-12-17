/*!
 * SVG plugin for Sketchable | v1.0 | Luis A. Leiva | MIT license
 */

/* eslint-env browser */
/* global jQuery */
;(function($) {

  // Custom namespace ID, for private data bindind.
  var namespace = 'sketchable';
  /**
   * SVG plugin constructor for jQuery Sketchable instances.
   * @param {jQuery} $instance - jQuery sketchable instance.
   * @namespace $.fn.sketchable.plugins.svg
   */
  $.fn.sketchable.plugins.svg = function($instance) {
    // Access the instance configuration.
    var config = $instance.sketchable('config');

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
      $instance.sketchable('decorate', evName, callbacks[evName], 'svg');
    }

    // Expose public API: all jQuery sketchable instances will have these methods.
    $.extend($.fn.sketchable.api, {
      // Namespace methods to avoid collisions with other plugins.
      svg: {
        /**
         * Generate SVG.
         * @param {function} callback - Callback function, executed with the SVG (string) as argument.
         * @return {jQuery} jQuery sketchable element.
         * @memberof $.fn.sketchable.plugins.svg
         * @example
         * jqueryElem.sketchable('svg.create', function(contents) {
         *   // Do something with the SVG string.
         * });
         */
        create: function(callback) {
          var data = $(this).data(namespace);
          data.sketch.toSVG(callback);
          return $instance;
        },
      },
    });

  };

})(jQuery);
