/*!
 * Serializer plugin for Sketchable | v1.0 | Luis A. Leiva | MIT license
 */

/* eslint-env browser */
/* global jQuery */
;(function($) {

  // Custom namespace ID, for private data bindind.
  var namespace = 'sketchable';
  /**
   * Serializer plugin constructor for jQuery Sketchable instances.
   * @param {jQuery} $instance - jQuery sketchable instance.
   * @namespace $.fn.sketchable.plugins.serializer
   */
  $.fn.sketchable.plugins.serializer = function($instance) {
    // Access the instance configuration.
    var config = $instance.sketchable('config');

    // Expose public API: all jQuery sketchable instances will have these methods.
    $.extend($.fn.sketchable.api, {
      // Namespace methods to avoid collisions with other plugins.
      serializer: {
        /**
         * Save canvas data as JSON string.
         * @return {string} serialized canvas data.
         * @memberof $.fn.sketchable.plugins.serializer
         * @example
         * var contents = jqueryElem.sketchable('serializer.save');
         */
        save: function(contents) {
          var data = $(this).data(namespace);
          // Save only the required properties.
          // Also avoid circular JSON references.
          return JSON.stringify({
            strokes: data.strokes,
            options: data.options,
            actions: data.sketch.callStack,
          });
        },
        /**
         * Load canvas data from JSON string.
         * @return {jQuery} jQuery sketchable element.
         * @memberof $.fn.sketchable.plugins.serializer
         * @example
         * jqueryElem.sketchable('serializer.load', jsonStr);
         */
        load: function(jsonStr) {
          var data = $(this).data(namespace);

          var origData = JSON.parse(jsonStr);
          var mySketch = data.sketch;
          for (var i = 0; i < origData.actions.length; i++) {
            var entry = origData.actions[i];
            if (entry.property && typeof entry.value !== 'object') {
              // Update graphics properties.
              mySketch.data[entry.property] = entry.value;
            } else if (entry.method) {
              mySketch[entry.method].apply(mySketch, entry.args);
            } else {
              console.warn('Unknown call:', entry);
            }
          }
          // Update required properties.
          data.callStack = origData.actions.slice();
          data.strokes = origData.strokes.slice();
          data.options = origData.options;

          return $instance;
        },
      },
    });

  };

})(jQuery);
