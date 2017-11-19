/*!
 * Memento plugin for jQuery Sketchable | v2.1 | Luis A. Leiva | MIT license
 */

/* eslint-env browser */
/* global jQuery */
;(function($) {

  // Custom namespace ID, for private data bindind.
  var namespace = 'sketchable';

  /**
   * This class implements the <a href="https://en.wikipedia.org/wiki/Memento_pattern">Memento pattern</a>
   * and is part of the {@link $.fn.sketchable.plugins.memento} plugin.
   * @class
   * @version 2.1
   * @param {Sketchable} $instance jQuery Sketchable element.
   * @example
   * var sketcher = $('canvas').sketchable();
   * // This is internally done by the plugin, plus some checks:
   * new MementoCanvas(sketcher);
   */
  function MementoCanvas($instance) {
    // Begin private stuff.
    var stack = [];
    var stpos = -1;
    var self  = this;
    /**
     * Update state.
     * @param {Image} snapshot Image object.
     * @param {Array} strokes Strokes associated with snapshot.
     * @private
     */
    function draw(snapshot, strokes) {
      // Manipulate canvas via jQuery sketchable API.
      // This way, we don't lose default drawing settings et al.
      $instance.sketchable('handler', function(elem, data) {
        //data.sketch.clear().drawImage(snapshot.src);
        // Note: jSketch.drawImage after clear creates some flickering,
        // so use the native HTMLCanvasElement.drawImage method instead.
        data.sketch.clear();
        data.sketch.context.drawImage(snapshot, 0, 0);
        // Update strokes.
        data.strokes = strokes.slice();
      });
    }
    /**
     * Key event manager.
     *  - Undo: "Ctrl + Z"
     *  - Redo: "Ctrl + Y" or "Ctrl + Shift + Z"
     * @param {Object} e DOM event.
     * @private
     * @todo Decouple shortcut definition, perhaps via jquery.hotkeys plugin.
     */
    function keyManager(e) {
      if (e.ctrlKey) {
        switch (e.which) {
        case 26: // Z
          if (e.shiftKey) self.redo();
          else self.undo();
          break;
        case 25: // Y
          self.redo();
          break;
        default:
          break;
        }
      }
    }
    /**
     * Goes back to the last saved state, if available.
     * @return {MementoCanvas} Class instance.
     */
    this.undo = function() {
      if (stpos > 0) {
        stpos--;
        this.restore();
      }
      return this;
    };
    /**
     * Goes forward to the last saved state, if available.
     * @return {MementoCanvas} Class instance.
     */
    this.redo = function() {
      if (stpos < stack.length - 1) {
        stpos++;
        this.restore();
      }
      return this;
    };
    /**
     * Resets stack.
     * @return {MementoCanvas} Class instance.
     */
    this.reset = function() {
      stack = [];
      stpos = -1;
      // Save blank state afterward.
      return this.save();
    };
    /**
     * Save current state.
     * @param {Object} evt DOM event.
     * @return {MementoCanvas} Class instance.
     */
    this.save = function(evt) {
      $instance.sketchable('handler', function(elem, data) {
        // With multitouch events, only the first event should be used to store a snapshot.
        // Then, the subsequent multitouch events must update current strokes data.
        if (evt && evt.identifier > 0) {
          stack[stpos].strokes = data.strokes.slice();
        } else {
          stack.push({image: elem[0].toDataURL(), strokes: data.strokes.slice()});
          stpos++;
        }
      });
      return this;
    };
    /**
     * Read current state: `{ image:String, strokes:Array }`.
     * @return {Object}
     */
    this.state = function() {
      // Create a fresh copy of the current state.
      return JSON.parse(JSON.stringify(stack[stpos]));
    };
    /**
     * Restore state.
     * @param {Object} state Canvas state: `{ image:String, strokes:Array }`. Default: current state.
     * @private
     */
    this.restore = function(state) {
      if (!state) state = stack[stpos];

      var snapshot = new Image();
      snapshot.src = state.image;
      snapshot.onload = function() {
        draw(this, state.strokes);
      };
    };
    /**
     * Init instance. Currently just (re)attach key event listeners.
     * @return {MementoCanvas} Class instance.
     */
    this.init = function() {
      $(document).off('keypress', keyManager);
      $(document).on('keypress', keyManager);
      // Save blank state to begin with.
      return this.save();
    };
    /**
     * Destroy instance: reset state and remove key event listeners.
     * @return {MementoCanvas} Class instance.
     */
    this.destroy = function() {
      $(document).off('keypress', keyManager);
      return this.reset();
    };

  }

  /**
   * Memento plugin constructor for jQuery Sketchable instances.
   * @param {Object} $instance jQuery Sketchable instance.
   * @memberof $.fn.sketchable.plugins
   */
  $.fn.sketchable.plugins.memento = function($instance) {
    // Access the instance configuration.
    var config = $instance.sketchable('config');

    var callbacks = {
      clear: function(elem, data) {
        data.memento.reset();
      },
      mouseup: function(elem, data, evt) {
        data.memento.save(evt);
      },
      destroy: function(elem, data) {
        data.memento.destroy();
      },
    };

    // A helper function to override user-defined event listeners.
    function override(evName) {
      // Flag event override so that it doesn't get fired more than once.
      if (config.options['_bound$' + evName]) return;
      config.options['_bound$' + evName] = true;

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
    var events = 'mouseup clear destroy'.split(' ');
    for (var i = 0; i < events.length; i++) {
      override(events[i]);
    }

    // Expose public API: all jQuery sketchable instances will have these methods.
    $.extend($.fn.sketchable.api, {
      // Namespace methods to avoid collisions with other plugins.
      memento: {
        /**
         * Goes back to the previous CANVAS state, if available.
         * @return {MementoCanvas}
         * @memberof $.fn.sketchable
         * @example jqueryElem.sketchable('memento.undo');
         */
        undo: function() {
          var data = $(this).data(namespace);
          return data.memento.undo();
        },
        /**
         * Goes forward to the previous CANVAS state, if available.
         * @return {MementoCanvas}
         * @memberof $.fn.sketchable
         * @example jqueryElem.sketchable('memento.redo');
         */
        redo: function() {
          var data = $(this).data(namespace);
          return data.memento.redo();
        },
        /**
         * Save a snapshot of the current CANVAS status.
         * @return {MementoCanvas}
         * @memberof $.fn.sketchable
         * @example jqueryElem.sketchable('memento.save');
         */
        save: function() {
          var data = $(this).data(namespace);
          return data.memento.save();
        },
        /**
         * Read current snapshot of the CANVAS state: `{ image:String, strokes:Array }`.
         * @return {Object}
         * @memberof Sketchable
         * @example var state = jqueryElem.sketchable('memento.state');
         */
        state: function() {
          var data = $(this).data(namespace);
          return data.memento.state();
        },
        /**
         * Restore a snapshot of the CANVAS.
         * @param {Object} state
         * @param {String} state.image Base64 image.
         * @param {Array} state.strokes Associated strokes.
         * @return {MementoCanvas}
         * @memberof Sketchable
         * @example jqueryElem.sketchable('memento.restore', state);
         */
        restore: function(state) {
          var data = $(this).data(namespace);
          return data.memento.restore(state);
        },
      },
    });

    // Initialize plugin here.
    config.memento = new MementoCanvas($instance);
    config.memento.init();
  };

})(jQuery);
