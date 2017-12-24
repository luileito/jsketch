/*!
 * jSketch SVG 1.0 | Luis A. Leiva | MIT license
 */

// XXX: Requires `jsketch.js` to be loaded first.

/**
 * SVG serializer for the jSketch lib.
 * @version 1.0
 * @author Luis A. Leiva
 * @license MIT license
 */
;(function(window) {
  /**
   * Convert jSketch canvas to SVG.
   * This method is asynchronous, and will be invoked when the SVG is ready.
   * @param {function} callback - Callback function, to be invoked with the SVG (string) as argument.
   * @return {jSketch}
   * @memberof jSketch
   * @method
   * @name toSVG
   */
  window.jSketch.prototype.toSVG = function(callback) {
    // No callback, no SVG.
    if (typeof callback !== 'function') throw new Error('You must supply a callback in toSVG() method.');
    // Save pointer for use in closures.
    var self = this;
    // Gather lines together until path is closed.
    var paths = [];
    // TODO: Save composite operations. See https://www.w3.org/TR/2002/WD-SVG11-20020215/masking.html
    var comps = {};
    // Flag async stuff, like image loading.
    var asyncOps = 0;
    // Process jSketch properties.
    var graphics = {};
    // Process jSketch methods.
    var methods = {
      /**
       * Add async flag.
       * @return {string}
       */
      addAsync: function() {
        asyncOps++;
        return '';
      },
      /**
       * Remove async flag.
       * @return {string}
       */
      removeAsync: function() {
        asyncOps--;
        return '';
      },
      /**
       * Serialize image.
       * @param {object} img - Image element.
       * @param {number} [x] - Horizontal coordinate.
       * @param {number} [y] - Vertical coordinate.
       * @return {string}
       */
      drawImage: function(img, x, y) {
        return '<image preserveAspectRatio="none" \
          width="' + img.width + '" \
          height="' + img.height + '" \
          transform="translate('+ x +', '+ y +')" \
          xlink:href="' + img.src + '"></image>';
      },
      /**
       * Serialize filled rectangle.
       * @param {number} x - Horizontal coordinate.
       * @param {number} y - Vertical coordinate.
       * @param {number} width - Rectangle width.
       * @param {number} height - Rectangle height.
       * @return {string}
       */
      fillRect: function(x, y, width, height) {
        return '<rect stroke="none" \
          width="' + width + '" \
          height="' + height + '" \
          x="' + x + '" \
          y="' + y + '" \
          fill="' + graphics.fillStyle + '"></rect>';
      },
      /**
       * Serialize stroked rectangle.
       * @param {number} x - Horizontal coordinate.
       * @param {number} y - Vertical coordinate.
       * @param {number} width - Rectangle width.
       * @param {number} height - Rectangle height.
       * @return {string}
       */
      strokeRect: function(x, y, width, height) {
        return '<rect fill="none" \
          width="' + width + '" \
          height="' + height + '" \
          x="' + x + '" \
          y="' + y + '" \
          stroke="' + graphics.strokeStyle + '" \
          stroke-width="' + graphics.lineWidth + '" \
          stroke-linecap="' + graphics.lineCap + '" \
          stroke-linejoin="' + graphics.lineJoin + '" \
          stroke-miterlimit="' + graphics.miterLimit + '"></rect>';
      },
      /**
       * Serialize stroked circle.
       * @param {number} x - Horizontal coordinate.
       * @param {number} y - Vertical coordinate.
       * @param {number} radius - Circle radius.
       * @return {string}
       */
      strokeCircle: function(x, y, radius) {
        return '<circle fill="none" \
          cx="' + x + '" \
          cy="' + y + '" \
          r="' + radius + '" \
          stroke="' + graphics.strokeStyle + '" \
          stroke-width="' + graphics.lineWidth + '" />';
      },
      /**
       * Serialize filled circle.
       * @param {number} x - Horizontal coordinate.
       * @param {number} y - Vertical coordinate.
       * @param {number} radius - Circle radius.
       * @return {string}
       */
      fillCircle: function(x, y, radius) {
        return '<circle stroke="none" \
          cx="' + x + '" \
          cy="' + y + '" \
          r="' + radius + '" \
          fill="' + graphics.fillStyle + '" />';
      },
      /**
       * Mark start of path.
       * @return {string}
       */
      beginPath: function() {
        paths = [];
        return '';
      },
      /**
       * Mark end of path. Actually serializes the path.
       * @return {string}
       */
      closePath: function() {
        var path = '';
        if (paths.length > 0) {
          path = '<path fill="none" \
            stroke="' + graphics.strokeStyle + '" \
            stroke-width="' + graphics.lineWidth + '" \
            stroke-linecap="' + graphics.lineCap + '" \
            stroke-linejoin="' + graphics.lineJoin + '" \
            stroke-miterlimit="' + graphics.miterLimit + '" \
            d="' + paths.join(' ') + '" />';
          paths = [];
        }
        return path;
      },
      /**
       * Add point origin to path.
       * @param {number} x - Horizontal coordinate.
       * @param {number} y - Vertical coordinate.
       * @return {string}
       */
      moveTo: function(x, y) {
        paths.push('M '+ x +' '+ y);
        return '';
      },
      /**
       * Add line to path.
       * @param {number} x - Horizontal coordinate.
       * @param {number} y - Vertical coordinate.
       * @return {string}
       */
      lineTo: function(x, y) {
        paths.push('L '+ x +' '+ y);
        return '';
      },
      /**
       * Add curve to path.
       * @param {number} cpx - Horizontal coordinate of control point.
       * @param {number} cpy - Vertical coordinate of control point.
       * @param {number} x - Horizontal coordinate.
       * @param {number} y - Vertical coordinate.
       * @return {string}
       */
      quadraticCurveTo: function(cpx, cpy, x, y) {
        paths.push('Q '+ cpx +' '+ cpy + ' '+ x +' '+ y);
        return '';
      },
    };

    // Create SVG.
    function build() {
      var svg = '<?xml version="1.0" encoding="utf-8" standalone="no" ?>';
      svg += '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" \
        "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">';
      svg += '<svg version="1.1" \
        xmlns="http://www.w3.org/2000/svg" \
        xmlns:svg="http://www.w3.org/2000/svg" \
        xmlns:xlink="http://www.w3.org/1999/xlink" \
        width="' + self.stageWidth + '" \
        height="' + self.stageHeight + '" \
        viewBox="0 0 ' + self.stageWidth + ' ' + self.stageHeight + '">';
      svg += '<desc>Generated with jSketch: https://luis.leiva.name/jsketch/</desc>';
      svg += '<defs></defs>';
      svg += '<g>';
      svg += processElements();
      svg += '</g>';
      svg += '</svg>';
      // Normalize whitespacing.
      return svg.replace(/\s+/g, ' ');
    }

    // Serialize jSketch elements.
    function processElements() {
      var ret = '';
      for (var i = 0; i < self.callStack.length; i++) {
        var entry = self.callStack[i];
        if (entry.property && typeof entry.value !== 'object') {
          // Save properties for later processing.
          graphics[entry.property] = entry.value;
        } else if (entry.method) {
          // Ensure method.
          if (!methods[entry.method]) {
            console.warn('Method not implemented:', entry.method);
            continue;
          }
          // Process method.
          ret += methods[entry.method].apply(null, entry.args);
        } else {
          console.warn('Unknown call:', entry);
        }
      }
      return ret;
    }

    // Throttle svg readiness.
    var timer = setInterval(checkReady, 150);
    function checkReady() {
      if (asyncOps <= 0) {
        clearInterval(timer);
        var contents = build();
        callback(contents);
      } else {
        console.info('Waiting for %s async operations to be finished ...', asyncOps);
      }
    }

    return this;
  };

})(this);
