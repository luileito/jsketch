/*!
 * Memento plugin for jQuery Sketchable | v2.3 | Luis A. Leiva | MIT license
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
   * @param {jQuery} $instance - jQuery sketchable element.
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
     * @param {Image} snapshot - Image object.
     * @param {object} state - State associated with snapshot.
     * @param {object} state.strokes - Strokes data.
     * @param {object} state.callStack - Actions history.
     * @private
     */
    function draw(snapshot, state) {
      // Manipulate canvas via jQuery sketchable API.
      // This way, we don't lose default drawing settings et al.
      $instance.sketchable('handler', function(elem, data) {
        //data.sketch.clear().drawImage(snapshot.src);
        // Note: jSketch.drawImage after clear creates some flickering,
        // so use the native HTMLCanvasElement.drawImage method instead.
        data.sketch.clear();
        data.sketch.context.drawImage(snapshot, 0, 0);
        // Update state data.
        data.strokes = state.strokes.slice();
        data.sketch.callStack = state.callStack.slice();
      });
    }

    /**
     * Update state.
     * @param {Image} snapshot - Image object.
     * @param {object} state - State associated with snapshot.
     * @param {object} state.strokes - Strokes data.
     * @param {object} state.callStack - Actions history.
     * @private
     */
    function save(ev) {
      $instance.sketchable('handler', function(elem, data) {
        // With multitouch events, only the first event should be used to store a snapshot.
        // Then, the subsequent multitouch events must update current strokes data.
        if (ev && ev.identifier > 0) {
          stack[stpos].strokes = data.strokes.slice();
        } else {
          stack.push({
            image: elem.get(0).toDataURL(),
            strokes: data.strokes.slice(),
            callStack: data.sketch.callStack.slice(),
          });
          stpos++;
        }
      });
    }

    /**
     * Key event manager.
     *  - Undo: "Ctrl + Z"
     *  - Redo: "Ctrl + Y" or "Ctrl + Shift + Z"
     * @param {object} ev - DOM event.
     * @private
     * @todo Decouple shortcut definition, perhaps via jquery.hotkeys plugin.
     */
    function keyManager(ev) {
      if (ev.ctrlKey) {
        switch (ev.which) {
        case 26: // Z
          if (ev.shiftKey) self.redo();
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

        $instance.sketchable('trigger', 'mementoundo');
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

        $instance.sketchable('trigger', 'mementoredo');
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

      $instance.sketchable('trigger', 'mementoreset');

      // Save blank state afterward.
      save();

      return this;
    };
    /**
     * Save current state.
     * @param {object} ev - DOM event.
     * @return {MementoCanvas} Class instance.
     */
    this.save = function(ev) {
      save(ev);

      $instance.sketchable('trigger', 'mementosave');

      return this;
    };
    /**
     * Read current state: `{ image:String, strokes:Array }`.
     * @return {object}
     */
    this.state = function() {
      // Create a fresh copy of the current state.
      return JSON.parse(JSON.stringify(stack[stpos]));
    };
    /**
     * Restore state.
     * @param {object} state - Canvas state: `{ image:String, strokes:Array }`. Default: current state.
     * @return {MementoCanvas} Class instance.
     * @private
     */
    this.restore = function(state) {
      if (!state) state = stack[stpos];

      var snapshot = new Image();
      snapshot.src = state.image;
      snapshot.onload = function() {
        draw(this, state);

        $instance.sketchable('trigger', 'mementochange');
      };

      return this;
    };
    /**
     * Init instance. Currently just (re)attach key event listeners.
     * @return {MementoCanvas} Class instance.
     */
    this.init = function() {
      $(document).off('keypress', keyManager);
      $(document).on('keypress', keyManager);

      $instance.sketchable('trigger', 'mementoinit');

      // Save blank state to begin with.
      save();

      return this;
    };
    /**
     * Destroy instance: reset state and remove key event listeners.
     * @return {MementoCanvas} Class instance.
     */
    this.destroy = function() {
      $(document).off('keypress', keyManager);

      $instance.sketchable('trigger', 'mementodestroy');

      return this.reset();
    };
  }

  /**
   * Memento plugin constructor for jQuery Sketchable instances.
   * @param {jQuery} $instance - jQuery sketchable instance.
   * @namespace $.fn.sketchable.plugins.memento
   */
  $.fn.sketchable.plugins.memento = function($instance) {
    var callbacks = {
      clear: function(elem, data) {
        data.memento.reset();
      },
      mouseup: function(elem, data, ev) {
        data.memento.save(ev);
      },
      destroy: function(elem, data) {
        data.memento.destroy();
      },
    };

    // Note: the init event is used to create jQuery sketchable instances,
    // therefore it should NOT be overriden.
    var events = 'mouseup clear destroy'.split(' ');
    for (var i = 0; i < events.length; i++) {
      var evName = events[i];
      $instance.sketchable('decorate', evName, callbacks[evName], 'memento');
    }

    // Expose public API: all jQuery sketchable instances will have these methods.
    $.extend($.fn.sketchable.api, {
      // Namespace methods to avoid collisions with other plugins.
      memento: {
        /**
         * Goes back to the previous CANVAS state, if available.
         * @return {jQuery} jQuery sketchable element.
         * @memberof $.fn.sketchable.plugins.memento
         * @example jqueryElem.sketchable('memento.undo');
         */
        undo: function() {
          var data = $(this).data(namespace);
          data.memento.undo();
          return $instance;
        },
        /**
         * Goes forward to the previous CANVAS state, if available.
         * @return {jQuery} jQuery sketchable element.
         * @memberof $.fn.sketchable.plugins.memento
         * @example jqueryElem.sketchable('memento.redo');
         */
        redo: function() {
          var data = $(this).data(namespace);
          data.memento.redo();
          return $instance;
        },
        /**
         * Save a snapshot of the current CANVAS.
         * @return {jQuery} jQuery sketchable element.
         * @memberof $.fn.sketchable.plugins.memento
         * @example jqueryElem.sketchable('memento.save');
         */
        save: function() {
          var data = $(this).data(namespace);
          data.memento.save();
          return $instance;
        },
        /**
         * Read current CANVAS state: `{ image:String, strokes:Array }`.
         * @return {object}
         * @memberof $.fn.sketchable.plugins.memento
         * @example var state = jqueryElem.sketchable('memento.state');
         */
        state: function() {
          var data = $(this).data(namespace);
          return data.memento.state();
        },
        /**
         * Restore a CANVAS state.
         * @param {object} state - State data.
         * @param {string} state.image - Base64 image.
         * @param {array} state.strokes - Associated strokes.
         * @return {jQuery} jQuery sketchable element.
         * @memberof $.fn.sketchable.plugins.memento
         * @example jqueryElem.sketchable('memento.restore', state);
         */
        restore: function(state) {
          var data = $(this).data(namespace);
          data.memento.restore(state);
          return $instance;
        },
      }
    });

    // Initialize plugin here.
    var data = $instance.sketchable('data');
    data.memento = new MementoCanvas($instance);
    data.memento.init();
  };

})(jQuery);
