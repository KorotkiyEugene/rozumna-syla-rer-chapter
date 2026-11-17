/* Ten milliseconds of the band of Wi-Fi and Bluetooth, as figure 2.4 of the chapter shows them: what is on the
   air at a moment, the humps of the spectrum of that moment and the sentence under the picture. The packets and
   the hops come with the page (they are the data of the figure): this file only looks them up. One file for the
   page and for the tests: node loads it as a module. The same computations stand in air_example.py, and a test
   compares the two at every position of the slider of the page. */
(function (root) {
  "use strict";

  // The moments of the slider: the middles of `slices` equal slices of `length` seconds.
  function moments(length, slices) {
    var out = [], step = length / slices, k;
    for (k = 0; k < slices; k += 1) { out.push((k + 0.5) * step); }
    return out;
  }

  // What is on the air at the moment t: whether a packet of Wi-Fi runs and the band of the hop of Bluetooth
  // (its lowest and highest frequency, hertz) or null. `d` holds the packets [start, end] and the hops
  // [start, end, lowest frequency, highest frequency].
  function onAir(t, d) {
    var wifi = d.wifi.some(function (p) { return p[0] < t && t < p[1]; });
    var hops = d.bluetooth.filter(function (h) { return h[0] < t && t < h[1]; });
    return { wifi: wifi, hop: hops.length ? [hops[0][2], hops[0][3]] : null };
  }

  // The humps of the spectrum at the moment t, from the lowest frequency: [lowest, highest, level].
  function humps(t, d) {
    var now = onAir(t, d), found = [];
    if (now.wifi) { found.push([d.wifi_band[0], d.wifi_band[1], d.levels.wifi]); }
    if (now.hop) { found.push([now.hop[0], now.hop[1], d.levels.bluetooth]); }
    return found.sort(function (a, b) { return a[0] - b[0]; });
  }

  // A moment as the page prints it: milliseconds with two digits after the comma.
  function momentText(t) {
    return (t * 1000).toFixed(2).replace(".", ",");
  }

  // The sentence under the picture.
  function told(t, d) {
    var w = d.words, now = onAir(t, d);
    var wifi = w.wifi[0] + (d.wifi_width_hz / 1e6).toFixed(0) + w.wifi[1];
    var hop = now.hop ? w.bluetooth[0] + (d.bt_width_hz / 1e6).toFixed(0) + w.bluetooth[1] +
      ((now.hop[0] + now.hop[1]) / 2 / 1e6).toFixed(0) + w.bluetooth[2] : "";
    var head = w.moment[0] + momentText(t) + w.moment[1];
    if (now.wifi && now.hop) { return head + w.both[0] + wifi + w.both[1] + hop + w.both[2]; }
    if (now.wifi || now.hop) { return head + w.one[0] + (now.wifi ? wifi : hop) + w.one[1]; }
    return head + w.quiet;
  }

  // How many times the wide band of Wi-Fi appears on the spectrum while the line goes from the top of the
  // spectrogram to its bottom.
  function packetsSeen(d) {
    var count = 0, before = false;
    moments(d.length_s, d.slices).forEach(function (t) {
      var now = onAir(t, d).wifi;
      if (now && !before) { count += 1; }
      before = now;
    });
    return count;
  }

  var api = { moments: moments, onAir: onAir, humps: humps, momentText: momentText, told: told, packetsSeen: packetsSeen };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    root.RerAir = api;
  }
})(typeof self !== "undefined" ? self : this);
