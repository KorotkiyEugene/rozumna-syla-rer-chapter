/* The radio-frequency part of a receiver, as figure 3.2 (б) of the chapter shows it: the spectrum of the signals
   at the antenna, the band that the filter lets through, the same band after the amplifier and the frequency
   converter, and the sentence under the picture. The signals come with the page (they are those of the figure).
   One file for the page and for the tests: node loads it as a module. The same computations stand in
   front_example.py, and a test compares the two at every position of the slider of the page. */
(function (root) {
  "use strict";

  // The lowest and the highest frequency that the filter lets through when the receiver is tuned to c.
  function band(c, d) {
    return [c - d.band_hz / 2, c + d.band_hz / 2];
  }

  // The height of the spectrum at the antenna at the frequency f: the highest of the humps of the signals
  // [frequency, height].
  function curve(f, d) {
    var top = 0;
    d.signals.forEach(function (s) {
      var x = (f - s[0]) / d.spike_hz;
      top = Math.max(top, s[1] * Math.exp(-0.5 * x * x));
    });
    return top;
  }

  // The height of the spectrum after the radio-frequency part at the frequency `inside`, counted from the lower
  // edge of the band: the amplifier made the signal higher, the converter moved the band down.
  function moved(c, inside, d) {
    return d.gain * curve(band(c, d)[0] + inside, d);
  }

  // The frequencies of the signals whose peaks lie in the band.
  function inside(c, d) {
    var b = band(c, d);
    return d.signals.filter(function (s) { return b[0] < s[0] && s[0] < b[1]; }).map(function (s) { return s[0]; });
  }

  // Whether a signal whose peak lies outside the band shows at an edge of it.
  function edge(c, d) {
    var b = band(c, d), reach = d.spike_hz * Math.sqrt(2 * Math.log(1 / d.edge_share));
    return d.signals.some(function (s) {
      return (s[0] <= b[0] && b[0] - s[0] < reach) || (s[0] >= b[1] && s[0] - b[1] < reach);
    });
  }

  // «1 сигнал», «3 сигнали», «6 сигналів», or that there are none.
  function signalsText(n, words) {
    if (n === 0) { return words.none; }
    var form = (n % 10 === 1 && n % 100 !== 11) ? 0
      : ([2, 3, 4].indexOf(n % 10) >= 0 && [12, 13, 14].indexOf(n % 100) < 0) ? 1 : 2;
    return n + " " + words.forms[form];
  }

  // The sentence under the picture.
  function told(c, d) {
    var w = d.words.told, b = band(c, d);
    return w[0] + (c / 1e6).toFixed(0) + w[1] + (b[0] / 1e6).toFixed(0) + w[2] + (b[1] / 1e6).toFixed(0) + w[3] +
      signalsText(inside(c, d).length, d.words) + w[4] + (edge(c, d) ? d.words.edge : "");
  }

  var api = { band: band, curve: curve, moved: moved, inside: inside, edge: edge, signalsText: signalsText, told: told };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    root.RerFront = api;
  }
})(typeof self !== "undefined" ? self : this);
