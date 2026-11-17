/* Modulation, as figure 2.3 of the chapter shows it: a message and the radio wave that carries it. The message
   changes the amplitude of the wave (AM) or its frequency (FM). Time runs from 0 to 1 across the picture, a
   height is counted in amplitudes of the wave without a message, s is the strength of the message from 0 to 1. The constants of
   the figure come with the page. One file for the page and for the tests: node loads it as a module. The same
   computations stand in modulation_example.py, and a test compares the two at every position of the controls. */
(function (root) {
  "use strict";

  // The message of the strength s at the moment t.
  function message(t, s, d) {
    return s * Math.sin(2 * Math.PI * d.message * t);
  }

  // The amplitude of the wave of amplitude modulation at the moment t: one is the wave without a message.
  function outline(t, s, d) {
    return 1 + d.depth * message(t, s, d);
  }

  // The radio wave that carries the message of the strength s in the given way, at the moment t.
  function wave(way, t, s, d) {
    if (way === "am") {
      return outline(t, s, d) * Math.sin(2 * Math.PI * d.carrier * t);
    }
    var gained = d.swing * s * (1 - Math.cos(2 * Math.PI * d.message * t)) / (2 * Math.PI * d.message);
    return Math.sin(2 * Math.PI * (d.carrier * t + gained));
  }

  // The least and the largest amplitude of amplitude modulation, as shares of the amplitude of the plain wave.
  function amplitudeRange(s, d) {
    return [1 - d.depth * s, 1 + d.depth * s];
  }

  // The least and the largest frequency of frequency modulation, as shares of the frequency of the plain wave.
  function frequencyRange(s, d) {
    return [1 - d.swing * s / d.carrier, 1 + d.swing * s / d.carrier];
  }

  // The sentence under the picture: what the message changes and how much.
  function told(way, s, d) {
    if (s === 0) { return d.words.told.none; }
    var w = d.words.told[way], r = way === "am" ? amplitudeRange(s, d) : frequencyRange(s, d);
    return w[0] + (100 * r[0]).toFixed(0) + w[1] + (100 * r[1]).toFixed(0) + w[2];
  }

  var api = { message: message, outline: outline, wave: wave, amplitudeRange: amplitudeRange,
              frequencyRange: frequencyRange, told: told };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    root.RerModulation = api;
  }
})(typeof self !== "undefined" ? self : this);
