/*!
 * Serializer plugin for Sketchable | v1.0 | Luis A. Leiva | MIT license
 */

// XXX: Requires `sketchable.utils.js` to be loaded first.

/* eslint-env browser */
/* global Event, dataBind, deepExtend */
;(function(window) {

  // Custom namespace ID, for private data bindind.
  var namespace = 'sketchable';
  /**
   * Serializer plugin constructor for Sketchable instances.
   * @param {Sketchable} instance - Sketchable element.
   * @namespace Sketchable.plugins.serializer
   */
  Sketchable.prototype.plugins.serializer = function(instance) {
    // Access the instance configuration.
    var config = instance.config();

    // Expose public API: all Sketchable instances will have these methods.
    deepExtend(instance, {
      // Namespace methods to avoid collisions with other plugins.
      serializer: {
        /**
         * Save canvas data as JSON string.
         * @return {string} Serialized canvas data.
         * @memberof Sketchable.plugins.serializer
         * @example
         * var contents = sketchableInstance.serializer.save();
         */
        save: function() {
          var data = dataBind(instance.elem)[namespace];
          // Save only the required properties.
          // Also avoid circular JSON references.
          return JSON.stringify({
            options: data.options,
            strokes: data.strokes,
            actions: data.sketch.callStack,
          });
        },
        /**
         * Load canvas from JSON string.
         * @param {string} jsonStr - JSON data saved with {@link Sketchable.plugins.serializer.save} method.
         * @return {Sketchable} Sketchable element.
         * @memberof Sketchable.plugins.serializer
         * @example
         * sketchableInstance.serializer.load(jsonStr);
         */
        load: function(jsonStr) {
          var data = dataBind(instance.elem)[namespace];

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
          data.sketch.callStack = origData.actions.slice();
          data.strokes = origData.strokes.slice();
          data.options = origData.options;

          return instance;
        },
      },
    });
  };

})(this);
