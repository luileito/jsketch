/*!
 * Memento plugin for jQuery sketchable | v1.2 | Luis A. Leiva | MIT license
 */
/**
 * @name $
 * @class
 * See <a href="http://jquery.com/">the jQuery library</a> for full details.
 * This just documents the method that is added to jQuery by this plugin.
 */
/**
 * @name $.fn
 * @class
 * See <a href="http://jquery.com/">the jQuery library</a> for full details.
 * This just documents the method that is added to jQuery by this plugin.
 */
;(function($) {

  /**
   * This plugin implements the <a href="https://en.wikipedia.org/wiki/Memento_pattern">Memento pattern</a>.
   * This plugin automatically modifies the jSketch instances, so no need to configure it.
   * @name MementoCanvas
   * @class
   * @version 1.2
   * @date 28 Nov 2016
   * @return Object
   * @example
   * var mc = new MementoCanvas( $('canvas-selector') );
   */
  var MementoCanvas = function($canvas) {

    // Private stuff //////////////////////////////////////////////////////////
    var stack = [];
    var stpos = -1;
    var self  = this;

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

    function restore(snapshot) {
      // Manipulate canvas via jQuery sketchable API.
      // This way, we don't lose default drawing settings et al.
      $canvas.sketchable('handler', function(elem, data){
        //data.sketch.clear().drawImage(snapshot.src);
        // Note: jSketch.drawImage after clear creates some flickering,
        // so use the native HTMLCanvasElement.drawImage method instead.
        data.sketch.clear();
        data.sketch.graphics.drawImage(snapshot, 0,0);
      });
    };

    // Key event manager.
    // Undo: "Ctrl + Z"
    // Redo: "Ctrl + Y" or "Ctrl + Shift + Z"
    // TODO: decouple shortcut definition, perhaps via jquery.hotkeys plugin.
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

    // Public stuff ///////////////////////////////////////////////////////////

    /**
     * Goes back to the last saved state, if available.
     * @name undo
     * @memberOf MementoCanvas
     */
    this.undo = function() {
      prev();
      $canvas.sketchable('handler', function(elem, data) {
        if (stack[stpos])
          data.strokes = stack[stpos].strokes.slice();
      });
    };
    /**
     * Goes forward to the last saved state, if available.
     * @name redo
     * @memberOf MementoCanvas
     */
    this.redo = function() {
      next();
      $canvas.sketchable('handler', function(elem, data) {
        if (stack[stpos])
          data.strokes = stack[stpos].strokes.slice();
      });
    };
    /**
     * Resets stack.
     * @name reset
     * @memberOf MementoCanvas
     */
    this.reset = function() {
      stack = [];
      stpos = -1;
    };
    /**
     * Save state.
     * @name save
     * @memberOf MementoCanvas
     */
    this.save = function() {
      stpos++;
      if (stpos < stack.length) stack.length = stpos;
      $canvas.sketchable('handler', function(elem, data) {
        stack.push({ image: elem[0].toDataURL(), strokes: data.strokes.slice() });
      });
    };
    /**
     * Init instance.
     * @name init
     * @memberOf MementoCanvas
     */
    this.init = function() {
      $(document).off('keypress', keyManager);
      $(document).on('keypress', keyManager);
    };
    /**
     * Destroy instance.
     * @name destroy
     * @memberOf MementoCanvas
     */
    this.destroy = function() {
      $(document).off('keypress', keyManager);
      this.reset();
    };

  };

  // Bind plugin extension ////////////////////////////////////////////////////
  var namespace    = 'sketchable';
  var plugin       = $.fn.sketchable;
  var availMethods = plugin('methods');

  function configure(elem, opts) {
    var options = $.extend(true, {}, plugin.defaults, opts);
    // Actually this plugin is singleton, so exit early.
    if (!options.interactive) return opts;

    var callbacks = {
      init: function(elem, data) {
        data.memento = new MementoCanvas(elem);
        data.memento.save();
        data.memento.init();
      },
      clear: function(elem, data) {
        data.memento.reset();
        data.memento.save();
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
      if (options && options.events && typeof options.events[ev] === 'function') {
        var fn = options.events[ev];
        options.events[ev] = function() {
          // Exec original function first, then exec our callback.
          var args = Array.prototype.slice.call(arguments, 0);
          fn.apply(elem, args);
          callbacks[ev].apply(elem, args);
        }
      } else {
        options.events[ev] = callbacks[ev];
      }
    };

    // Event order matters.
    // Init must go first, since it's called when instantiating the plugin.
    var events = 'init mouseup clear destroy'.split(' ');
    for (var i = 0; i < events.length; i++) {
      override(events[i]);
    }

    // Expose public API for jquery.sketchable plugin.
    $.extend(availMethods, {
      undo: function() {
        var elem = $(this), data = elem.data(namespace);
        data.memento.undo();
      },
      redo: function() {
        var elem = $(this), data = elem.data(namespace);
        data.memento.redo();
      },
      save: function() {
        var elem = $(this), data = elem.data(namespace);
        data.memento.save();
      },
    });

    return options;
  };

  /**
   * Creates a new memento-capable jQuery.sketchable object.
   * @param {String|Object} method name of the method to invoke,
   *  or a configuration object.
   * @return jQuery
   * @class
   * @example
   * $(selector).sketchable();
   * $(selector).sketchable({interactive:false});
   */
  var initfn = availMethods.init;
  availMethods.init = function(opts) {
    return this.each(function() {
      var elem = $(this);
      var conf = configure(elem, opts);
      initfn.call(elem, conf);
    });
  };

})(jQuery);
