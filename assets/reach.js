/* How far a receiver hears a transmitter before the bulge of the Earth hides it, as figure 1.2 of the chapter
   shows it: a cut through the Earth, the antenna of the receiver, the straight line between the two antennas
   and the farthest transmitter that is still heard. Every quantity is in metres. The radius of the Earth as
   radio waves meet it and the height of the antenna of the transmitter come with the page. One file for the
   page and for the tests: node loads it as a module. The same computations stand in reach_example.py, and a
   test compares the two at every position of the slider of the page. */
(function (root) {
  "use strict";

  // Where the straight line from an antenna at the height h touches the ground.
  function touch(h, d) {
    return Math.sqrt(2 * d.radius_m * h);
  }

  // How far a receiver with the antenna at the height h hears the transmitter.
  function reach(h, d) {
    return touch(h, d) + touch(d.low_m, d);
  }

  // The height of the ground at the distance x, counted from the level of the foot of the receiver.
  function surface(x, d) {
    return -x * x / (2 * d.radius_m);
  }

  // The height of the straight line from the antenna of the receiver at the distance x.
  function line(h, x, d) {
    return h - x * touch(h, d) / d.radius_m;
  }

  // A number with one decimal and a comma, without a needless zero: «21,8», «98».
  function number(value) {
    return value.toFixed(1).replace(/\.0$/, "").replace(".", ",");
  }

  // The sentence under the picture.
  function told(h, d) {
    var w = d.words.told;
    return w[0] + h.toFixed(0) + w[1] + number(reach(h, d) / 1000) + w[2] + (d.words.named[h.toFixed(0)] || "");
  }

  var api = { touch: touch, reach: reach, surface: surface, line: line, number: number, told: told };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    root.RerReach = api;
  }
})(typeof self !== "undefined" ? self : this);
