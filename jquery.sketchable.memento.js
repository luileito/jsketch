/*!
 * Memento plugin for jQuery Sketchable | v2.0 | Luis A. Leiva | MIT license
 */

/* eslint-env browser */
;(function($) {

  // Custom namespace ID, for private data bindind.
  var namespace = 'sketchable';

  /**
   * This class implements the <a href="https://en.wikipedia.org/wiki/Memento_pattern">Memento pattern</a>
   * and is part of the {@link $.fn.sketchable.plugins.memento} plugin.
   * @class
   * @version 2.0
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
     * @private
     */
    function prev() {
      if (stpos > 0) {
        stpos--;
        var snapshot = new Image();
        snapshot.src = stack[stpos].image;
        snapshot.onload = function() {
          restore(this);
        };
      }
    };
    /**
     * @private
     */
    function next() {
      if (stpos < stack.length - 1) {
        stpos++;
        var snapshot = new Image();
        snapshot.src = stack[stpos].image;
        snapshot.onload = function() {
          restore(this);
        };
      }
    };
    /**
     * Snashot restorer.
     * @param {String} snapshot Base64 image.
     * @private
     */
    function restore(snapshot) {
      // Manipulate canvas via jQuery sketchable API.
      // This way, we don't lose default drawing settings et al.
      $instance.sketchable('handler', function(elem, data){
        //data.sketch.clear().drawImage(snapshot.src);
        // Note: jSketch.drawImage after clear creates some flickering,
        // so use the native HTMLCanvasElement.drawImage method instead.
        data.sketch.clear();
        data.sketch.graphics.drawImage(snapshot, 0,0);
      });
    };
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
    };

    /**
     * Goes back to the last saved state, if available.
     * @return {MementoCanvas} Class instance.
     */
    this.undo = function() {
      prev();
      $instance.sketchable('handler', function(elem, data) {
        if (stack[stpos])
          data.strokes = stack[stpos].strokes.slice();
      });
      return this;
    };
    /**
     * Goes forward to the last saved state, if available.
     * @return {MementoCanvas} Class instance.
     */
    this.redo = function() {
      next();
      $instance.sketchable('handler', function(elem, data) {
        if (stack[stpos])
          data.strokes = stack[stpos].strokes.slice();
      });
      return this;
    };
    /**
     * Resets stack.
     * @return {MementoCanvas} Class instance.
     */
    this.reset = function() {
      stack = [];
      stpos = -1;
      return this;
    };
    /**
     * Save current state.
     * @return {MementoCanvas} Class instance.
     */
    this.save = function() {
      stpos++;
      if (stpos < stack.length) stack.length = stpos;
      $instance.sketchable('handler', function(elem, data) {
        stack.push({ image: elem[0].toDataURL(), strokes: data.strokes.slice() });
      });
      return this;
    };
    /**
     * Init instance. Currently just (re)attach key event listeners.
     * @return {MementoCanvas} Class instance.
     */
    this.init = function() {
      $(document).off('keypress', keyManager);
      $(document).on('keypress', keyManager);
      return this;
    };
    /**
     * Destroy instance: reset state and remove key event listeners.
     * @return {MementoCanvas} Class instance.
     */
    this.destroy = function() {
      $(document).off('keypress', keyManager);
      return this.reset();
    };

  };

  /**
   * Memento plugin constructor for jQuery Sketchable instances.
   * @param {Object} $instance - A jQuery Sketchable instance.
   * @memberof $.fn.sketchable.plugins
   */
  $.fn.sketchable.plugins.memento = function($instance) {
    var config = $instance.sketchable('config');

    var callbacks = {
      clear: function(elem, data) {
        data.memento.reset();
      },
      mouseup: function(elem, data, evt) {
        data.memento.save();
      },
      destroy: function(elem, data) {
        data.memento.destroy();
      }
    };

    // A helper function to override user-defined event listeners.
    function override(ev) {
      // Flag event override so that it doesn't get fired more than once.
      if (config.options.$$bound) return;
      config.options.$$bound = true;

      if (config.options.events && typeof config.options.events[ev] === 'function') {
        // User has defined this event, so wrap it.
        var fn = config.options.events[ev];
        config.options.events[ev] = function() {
          // Exec original function first, then exec our callback.
          fn.apply($instance, arguments);
          callbacks[ev].apply($instance, arguments);
        }
      } else {
        // User has not defined this event, so attach our callback.
        config.options.events[ev] = callbacks[ev];
      }
    };

    // Note: the init event is used to create sketchable instances,
    // therefore it should NOT be overriden.
    var events = 'mouseup clear destroy'.split(' ');
    for (var i = 0; i < events.length; i++) {
      override(events[i]);
    }

    // Expose public API: all sketchable instances will have these methods.
    $.extend($.fn.sketchable.api, {
      /**
       * Goes back to the previous CANVAS state, if available.
       * @memberof $.fn.sketchable
       * @example $('canvas').sketchable('undo');
       */
      undo: function() {
        var elem = $(this), data = elem.data(namespace);
        data.memento.undo();
      },
      /**
       * Goes forward to the previous CANVAS state, if available.
       * @memberof $.fn.sketchable
       * @example $('canvas').sketchable('redo');
       */
      redo: function() {
        var elem = $(this), data = elem.data(namespace);
        data.memento.redo();
      },
      /**
       * Save a snapshot of the current CANVAS status.
       * @memberof $.fn.sketchable
       * @example $('canvas').sketchable('save');
       */
      save: function() {
        var elem = $(this), data = elem.data(namespace);
        data.memento.save();
      },
    });

    // Initialize plugin here.
    config.memento = new MementoCanvas($instance);
    config.memento.init().save();
  };

})(jQuery);
