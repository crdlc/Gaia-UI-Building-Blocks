
'use strict';

var utils = this.utils || {};

utils.seekbars = (function() {

  var sliders = [];

  // Supporting mouse or touch events depending on the delivery context
  var isTouch = 'ontouchstart' in window;
  var touchstart = isTouch ? 'touchstart' : 'mousedown';
  var touchmove = isTouch ? 'touchmove' : 'mousemove';
  var touchend = isTouch ? 'touchend' : 'mouseup';

  /*
   * Returns the pageX value depending on event type
   */
  var getX = (function getXWrapper() {
    return isTouch ? function(e) { return e.touches[0].pageX; } :
                     function(e) { return e.pageX; };
  })();

  /*
   * Slider constructor
   */
  var Slider = function(element) {
    this.container = element; // DOMElement with slider role
    this.handler = element.querySelector('progress + button');
    var progress = this.progress = element.querySelector('progress');

    // We are going to calculate the limits to translate the handler
    var rect = progress.getBoundingClientRect();
    this.progressLeft = rect.left;
    this.progressRight = rect.right;

    // This is the progress bar width
    this.progressWidth = progress.clientWidth;

    // If the max attr is not defined this module sets to 100% by default
    var max = this.max = parseInt(progress.getAttribute('max'), 10) || 100;

    // If the value attr is not defined this module sets to 0% by default
    var value = this.value = parseInt(progress.getAttribute('value'), 10) || 0;

    // At the beginning we have to place the handler depending on the value
    this.handler.style.left = ((100 * value) / max) + '%';

    this.deltaX = 0;

    // Waiting for events on the UI
    element.addEventListener(touchstart, this);
  };

  Slider.prototype = {
    handleEvent: function slider_handleEvent(evt) {
      switch (evt.type) {
        case touchstart:
          // We cannot prevent the default behavior here in order to allow
          // active pseudo class
          this.startX = this.currentX = getX(evt);
          this.container.removeEventListener(touchstart, this);

          if (evt.target === this.progress) {
            // Touching the progress bar instead of the handler
            this.startX = this.handler.getBoundingClientRect().left +
                          (this.handler.clientWidth / 2);
            this.change();
          } else {
            window.addEventListener(touchmove, this);
          }

          window.addEventListener(touchend, this);

          break;

        case touchmove:
          evt.preventDefault();
          var x = getX(evt);
          if (x < this.progressLeft || x > this.progressRight) {
            // We are moving the finger outside
            return;
          }

          this.currentX = x;
          this.change();
          break;

        case touchend:
          evt.preventDefault();
          this.deltaX = this.getDeltaX(); // Saving the last delta value
          this.container.addEventListener(touchstart, this);
          window.removeEventListener(touchmove, this);
          window.removeEventListener(touchend, this);

          break;
      }
    },

    /*
     * Calculates the delta in x-coordinate
     */
    getDeltaX: function getDeltaX() {
      return this.deltaX + this.currentX - this.startX;
    },

    /*
     * Translates the handler and changes the value of the progress bar
     */
    change: function change() {
      var deltaX = this.getDeltaX();
      // Translates the handler button
      this.handler.style.MozTransform = 'translateX(' + deltaX + 'px)';

      // Changes the progress value
      this.progress.setAttribute('value',
                       this.value + (this.max * (deltaX / this.progressWidth)));
      this.progress.dispatchEvent(new Event('change', {
        bubbles: true
      }));
    },

    destroy: function destroy() {
      // Removing listeners
      this.container.removeEventListener(touchstart, this);

      // Variables to null
      this.progress = this.container = this.handler = this.max =
      this.progressWidth = this.value = this.deltaX = this.currentX =
      this.progressLeft = this.progressRight = null;
    }
  };

  function initialize() {
    reset();
    // Looking for ALL sliders in the DOM
    var sliderElements = document.querySelectorAll('[role="slider"]');
    for (var i = 0; i < sliderElements.length; i++) {
      sliders.push(new Slider(sliderElements[i]));
    }
  }

  function reset() {
    sliders.forEach(function(slider) {
      slider.destroy();
    });
  }

  // Initializing the library
  if (document.readyState === 'complete') {
    initialize();
  } else {
    document.addEventListener('DOMContentLoaded', function loaded() {
      document.removeEventListener('DOMContentLoaded', loaded);
      initialize();
    });
  }

  return {
    /*
     * This library is auto-executable although we need this public method
     * for unit testing
     */
    init: initialize,


    /*
     * Destroys all variables and removes event listeners running
     */
    destroy: reset
  };

})();
