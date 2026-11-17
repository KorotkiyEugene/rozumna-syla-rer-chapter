/* A transmitter that hops in frequency and the band of a reconnaissance receiver, as topic 7 of the chapter
   counts them. The order of the hops comes from the generator of Park and Miller, x' = 48271 x mod (2^31 - 1):
   whole numbers only, and 48271 * (2^31 - 1) stays below 2^53, so JavaScript counts it exactly. One file for the
   page and for the tests: node loads it as a module. The same computations stand in hide_example.py, and a test
   compares the two at every position of the sliders of the page. */
(function (root) {
  "use strict";
  var MULTIPLIER = 48271, MODULUS = 2147483647;

  // The next `count` numbers of the generator after the seed.
  function draws(count, seed) {
    var x = seed, out = [], i;
    for (i = 0; i < count; i += 1) {
      x = x * MULTIPLIER % MODULUS;
      out.push(x);
    }
    return out;
  }

  // The frequency of every hop: a number from 0 to channels - 1.
  function sequence(channels, hops, seed) {
    return draws(hops, seed).map(function (x) { return x % channels; });
  }

  // The lowest frequency that the receiver hears: its band stands in the middle of the band of the transmitter.
  function bandLow(channels, band) {
    return Math.max(0, Math.floor((channels - band) / 2));
  }

  // The band that the page keeps: never wider than the frequencies of the transmitter.
  function bandFor(channels, band) {
    return Math.min(band, channels);
  }

  // Whether the receiver hears a frequency.
  function inside(channel, channels, band) {
    var low = bandLow(channels, band);
    return channel >= low && channel < low + band;
  }

  // How many hops land inside the band of the receiver.
  function caught(channels, band, hops, seed) {
    return sequence(channels, hops, seed).filter(function (c) { return inside(c, channels, band); }).length;
  }

  // The count as the page prints it: `words` are the words before, between and after the two numbers.
  function caughtText(count, hops, words) {
    return words[0] + count + words[1] + hops + words[2];
  }

  var api = { draws: draws, sequence: sequence, bandLow: bandLow, bandFor: bandFor, inside: inside, caught: caught, caughtText: caughtText };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    root.RerHop = api;
  }
})(typeof self !== "undefined" ? self : this);
