/* The model of an antenna array of the page of topic 3: a row of equal elements that stand half a wavelength
   apart before a screen, so each element receives only from the front. The signals of the elements are added,
   each next one with the same shift. One file for the page and for the tests: node loads it as a module.
   The curve is the curve of figure 3.2 (в) of the chapter: the tests compare it with the script of the figure. */
(function (root) {
  "use strict";

  var SPACING = 0.5;               // the distance between neighbouring elements, in wavelengths
  var MIN_ELEMENTS = 2, MAX_ELEMENTS = 16;
  var MAX_SHIFT = 0.3;             // the largest shift of the page, in periods of the oscillation
  var HALF_POWER = Math.SQRT1_2;   // the curve shows the size of the signal: half the power is 1/√2 of the size

  // A shift between neighbours given in parts of a period, in radians: a whole period is a full turn.
  function shift(part) {
    return 2 * Math.PI * part;
  }

  // The size of the sum of the signals from one direction, not yet brought to one at the best direction.
  // The direction is in degrees from the line of the elements: 90 is straight ahead.
  function sum(n, spacing, shiftRad, degrees) {
    var a = degrees * Math.PI / 180;
    var phase = 2 * Math.PI * spacing * Math.cos(a) - shiftRad;
    var re = 0, im = 0, k;
    for (k = 0; k < n; k += 1) {
      re += Math.cos(k * phase);
      im += Math.sin(k * phase);
    }
    return Math.sqrt(re * re + im * im) / n * Math.max(Math.sin(a), 0);
  }

  // The best direction and the sum there: a grid of a tenth of a degree, then a grid of a ten-thousandth
  // around its best point. The script of the figure looks for the greatest value in the same way.
  function peak(n, spacing, shiftRad) {
    var best = 0, top = -1, i, d, v, near;
    for (i = 0; i <= 1800; i += 1) {
      d = i / 10;
      v = sum(n, spacing, shiftRad, d);
      if (v > top) { top = v; best = d; }
    }
    near = best;
    top = -1;
    for (i = 0; i <= 2000; i += 1) {
      d = near - 0.1 + i * 0.0001;
      v = sum(n, spacing, shiftRad, d);
      if (v > top) { top = v; best = d; }
    }
    return { direction: best, value: top };
  }

  // How well the row receives from each of the directions, brought to one at its best direction.
  function pattern(n, spacing, shiftRad, degrees) {
    var top = peak(n, spacing, shiftRad).value;
    return degrees.map(function (d) { return sum(n, spacing, shiftRad, d) / top; });
  }

  // The direction beside the best one from which the row receives half the power: `step` is +1 or -1.
  function edge(n, spacing, shiftRad, p, step) {
    var inside = p.direction, outside = p.direction, middle, i;
    do {
      inside = outside;
      outside = Math.min(180, Math.max(0, inside + step * 0.05));
    } while (sum(n, spacing, shiftRad, outside) > HALF_POWER * p.value && outside !== inside);
    for (i = 0; i < 40; i += 1) {
      middle = (inside + outside) / 2;
      if (sum(n, spacing, shiftRad, middle) > HALF_POWER * p.value) { inside = middle; } else { outside = middle; }
    }
    return (inside + outside) / 2;
  }

  // The beam: its best direction and the two directions between which the row receives at least half the
  // power of the best one. The angle between these two is the width of the beam.
  function beam(n, spacing, shiftRad) {
    var p = peak(n, spacing, shiftRad);
    return { best: p.direction, from: edge(n, spacing, shiftRad, p, -1), to: edge(n, spacing, shiftRad, p, 1) };
  }

  function whole(x) {
    return Math.floor(x + 0.5);
  }

  function plain(x) {
    return String(x).replace(".", ",").replace("-", "−");
  }

  // The sentence under the picture of the page. A positive shift turns the beam to the right of the picture.
  function readout(n, part) {
    var fits = typeof n === "number" && typeof part === "number" && isFinite(n) && isFinite(part) &&
               Math.floor(n) === n && n >= MIN_ELEMENTS && n <= MAX_ELEMENTS && Math.abs(part) <= MAX_SHIFT + 1e-9;
    if (!fits) {
      return "Оберіть кількість елементів від " + MIN_ELEMENTS + " до " + MAX_ELEMENTS + " і зсув від " +
             plain(-MAX_SHIFT) + " до " + plain(MAX_SHIFT) + " періоду.";
    }
    var b = beam(n, SPACING, shift(part));
    var turn = whole(Math.abs(90 - b.best));
    var where = turn === 0 ? "Промінь спрямовано прямо перед решіткою."
                           : "Промінь повернуто на " + turn + "° " + (b.best < 90 ? "праворуч" : "ліворуч") + ".";
    return where + " Ширина променя " + whole(b.to - b.from) + "°.";
  }

  var api = { SPACING: SPACING, MIN_ELEMENTS: MIN_ELEMENTS, MAX_ELEMENTS: MAX_ELEMENTS, MAX_SHIFT: MAX_SHIFT,
              shift: shift, pattern: pattern, beam: beam, readout: readout };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    root.RerArray = api;
  }
})(typeof self !== "undefined" ? self : this);
