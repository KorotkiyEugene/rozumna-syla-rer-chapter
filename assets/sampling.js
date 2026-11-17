/* The samples of an analogue-to-digital converter, as figure 3.6 (б) of the chapter shows them: a signal of
   d.cycles oscillations, n samples of it at equal intervals and the slowest wave that passes through all the
   samples. Time runs from 0 to 1 across the picture. One file for the page and for the tests: node loads it as
   a module. The same computations stand in sampling_example.py, and a test compares the two at every position
   of the slider of the page. */
(function (root) {
  "use strict";

  // The signal at the moment t.
  function signal(t, d) {
    return Math.sin(2 * Math.PI * d.cycles * t);
  }

  // The moments of n samples at equal intervals and the values of the signal at them.
  function samples(n, d) {
    var times = [], values = [];
    for (var k = 0; k < n; k += 1) {
      times.push(k / n);
      values.push(signal(k / n, d));
    }
    return [times, values];
  }

  // The oscillations of the slowest wave with the samples of the signal: those of the signal less a whole count
  // of n. Its sign says whether that wave starts upwards, like the signal, or downwards.
  function rest(n, d) {
    return d.cycles - n * Math.floor(d.cycles / n + 0.5);
  }

  // Whether all the samples are alike: two oscillations of the signal take a whole count of steps.
  function flat(n, d) {
    return (2 * d.cycles) % n === 0;
  }

  // The slowest wave that passes through all the n samples, at the moment t.
  function shown(n, t, d) {
    if (flat(n, d)) { return 0; }
    var r = rest(n, d);
    return (r > 0 ? 1 : -1) * Math.sin(2 * Math.PI * Math.abs(r) * t);
  }

  // Whether the samples show the signal itself: more than two of them for every oscillation.
  function follows(n, d) {
    return n > 2 * d.cycles;
  }

  // Samples for one oscillation: «1,1», «2».
  function perCycle(n, d) {
    return (n / d.cycles).toFixed(1).replace(/\.0$/, "").replace(".", ",");
  }

  function form(n) {
    return (n % 10 === 1 && n % 100 !== 11) ? 0
      : ([2, 3, 4].indexOf(n % 10) >= 0 && [12, 13, 14].indexOf(n % 100) < 0) ? 1 : 2;
  }

  // The sentence under the picture.
  function told(n, d) {
    var w = d.words.told;
    var head = n + " " + w.samples[form(n)] + w.head[0] + d.cycles + " " + w.cycles[form(d.cycles)] + w.head[1] +
      perCycle(n, d) + w.head[2];
    if (flat(n, d)) { return head + w.flat; }
    var c = Math.abs(rest(n, d));
    return head + w.lie[0] + c + " " + w.cycles[form(c)] + w.lie[1] + (follows(n, d) ? w["true"] : w["false"]);
  }

  var api = { signal: signal, samples: samples, rest: rest, flat: flat, shown: shown, follows: follows,
              perCycle: perCycle, told: told };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    root.RerSampling = api;
  }
})(typeof self !== "undefined" ? self : this);
