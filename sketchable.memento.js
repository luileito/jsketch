/*!
 * Memento plugin for sketchable | v1.2 | Luis A. Leiva | MIT license
 */
/*
  Requires sketchable.utils.js to be loaded first.
  globals: Event, dataBind, deepExtend.
*/
;(function(window) {
  /**
   * This plugin implements the <a href="https://en.wikipedia.org/wiki/Memento_pattern">Memento pattern</a>.
   * This plugin automatically modifies the jSketch instances, so no need to configure it.
   * @name MementoCanvas
   * @class
   * @version 1.2
   * @return Object
   * @example
   * var mc = new MementoCanvas( $('canvas-selector') );
   */

//  // TODO: Extend Sketchable class.
//  MementoCanvas.prototype = new Sketchable(elem, opts);
//  MementoCanvas.constructor = Sketchable;

  var MementoCanvas = function(sketchable) {

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
      sketchable.handler(function(elem, data){
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
    // TODO: decouple shortcut definition.
    function keyManager(e) {
      if (e.ctrlKey) {
        switch (e.which) {
          case 26: // Z
            if (e.shiftKey) sketchable.redo();
            else sketchable.undo();
            break;
          case 25: // Y
            sketchable.redo();
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
      sketchable.handler(function(elem, data) {
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
      sketchable.handler(function(elem, data) {
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
      sketchable.handler(function(elem, data) {
        stack.push({ image: elem.toDataURL(), strokes: data.strokes.slice() });
      });
    };
    /**
     * Init instance.
     * @name init
     * @memberOf MementoCanvas
     */
    this.init = function() {
      // Prevent subsequent instances to re-attach this event to the document.
      Event.remove(document, "keypress", keyManager);
      Event.add(document, "keypress", keyManager);
    };
    /**
     * Destroy instance.
     * @name destroy
     * @memberOf MementoCanvas
     */
    this.destroy = function() {
      Event.remove(document, "keypress", keyManager);
      this.reset();
    };

  };

  // Bind plugin extension ////////////////////////////////////////////////////
  var namespace    = "sketchable";
  var availMethods = Sketchable.fn;
  var defaults     = Sketchable.fn.defaults;

  function configure(sketchable, opts) {
    var options = deepExtend(defaults, opts);
    // Actually this plugin is singleton, so exit early.
    if (!options.interactive) return opts;

    var elem = sketchable.elem;

    var callbacks = {
      init: function(elem, data) {
        data.memento = new MementoCanvas(sketchable);
        data.memento.save();
        data.memento.init();
      },
      clear: function(elem, data) {
        data.memento.save();
      },
      mouseup: function(elem, data, e) {
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
        defaults.events[ev] = callbacks[ev];
      }
    };

    // Avoid re-attaching the same callbacks more than once.
    if (!availMethods.isMementoReady) {
      // Event order matters.
      var events = 'init mouseup clear destroy'.split(" ");
      for (var i = 0; i < events.length; i++) {
        override(events[i]);
      }
      availMethods.isMementoReady = true;
    }

    // Expose public API for sketchable plugin.
    deepExtend(availMethods, {
      undo: function() {
        var elem = this.elem, data = dataBind(elem)[namespace];
        data.memento.undo();
      },
      redo: function() {
        var elem = this.elem, data = dataBind(elem)[namespace];
        data.memento.redo();
      }
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
    var conf = configure(this, opts);
    initfn.call(this, conf);
    return this;
  };

})(this);
