/* The live picture «Спектр і спектрограма» on the page of topic 2: figure 2.4 of the chapter with a line of the
   moment that the slider leads down the spectrogram, and above it the spectrum of that moment. What is on the
   air comes from air.js (window.RerAir): this file only draws. The packets, the hops, the colours and the words
   come with the page (window.RER_T2.air). The picture is drawn point for point (draw.js), so it is drawn again
   when the width of the window changes. */
(function () {
  "use strict";
  var A = window.RerAir, D = window.RerDraw, P = window.RER_T2.air;
  var step = document.getElementById("air-step");
  var svg = document.getElementById("air-plot");
  var told = document.getElementById("air-out");
  var shown = document.getElementById("air-step-out");
  if (!step || !svg) { return; }

  var LEFT = 46, RIGHT = 12, TOP = 38;                 // room for the names and the numbers of the axes
  var SPECTRUM = 84, GAP = 18, ROWS = 240, BOTTOM = 8;  // the heights of the two panels, points of the screen
  var NAMES = 18;                                       // the row of the names of the humps, at the top of the spectrum
  var times = A.moments(P.length_s, P.slices);

  function draw() {
    var t = times[Number(step.value)];
    var wide = Math.min(D.width(svg), 640), high = TOP + SPECTRUM + GAP + ROWS + BOTTOM;
    var spTop = TOP, spBot = TOP + SPECTRUM, sgTop = spBot + GAP, sgBot = sgTop + ROWS;
    function x(f) { return LEFT + (f - P.band[0]) / (P.band[1] - P.band[0]) * (wide - LEFT - RIGHT); }
    function y(s) { return sgTop + s / P.length_s * ROWS; }
    function level(l) { return spBot - (0.10 + 0.78 * l) * (SPECTRUM - NAMES); }
    function inside(span) { return span[0] < t && t < span[1]; }

    D.sheet(svg, wide, high);
    // The axis of frequency stands above both panels, as in the figure.
    D.shape(svg, "text", { x: LEFT + (wide - LEFT - RIGHT) / 2, y: 12, "class": "num" }, P.words.frequency);
    P.ticks_hz.forEach(function (f) {
      D.shape(svg, "line", { x1: x(f), y1: spTop - 4, x2: x(f), y2: sgBot, stroke: P.colours.grid, "stroke-width": 1 });
      D.shape(svg, "text", { x: x(f), y: spTop - 8, "class": "num" }, (f / 1e6).toFixed(0));
    });
    // The spectrum of the moment: a floor and a hump for everything that is on the air.
    var floor = level(0), points = [[x(P.band[0]), floor]];
    A.humps(t, P).forEach(function (h) {
      var skirt = (x(h[1]) - x(h[0])) > 20 ? P.skirts_hz.wifi : P.skirts_hz.bluetooth;
      points.push([x(h[0] - skirt), floor], [x(h[0] + skirt), level(h[2])], [x(h[1] - skirt), level(h[2])], [x(h[1] + skirt), floor]);
    });
    points.push([x(P.band[1]), floor]);
    D.shape(svg, "path", { d: D.path(points.concat([[x(P.band[1]), spBot], [x(P.band[0]), spBot]])) + " Z", fill: P.colours.pale });
    D.shape(svg, "path", { d: D.path(points), fill: "none", stroke: P.colours.strong, "stroke-width": 2, "stroke-linejoin": "round" });
    D.shape(svg, "line", { x1: LEFT, y1: spBot, x2: wide - RIGHT, y2: spBot, stroke: P.colours.muted, "stroke-width": 1 });
    // The names of the humps stand in a row above them. The name of the hop gives way to the name of Wi-Fi.
    var now = A.onAir(t, P), keepOut = null;
    function named(word, at) {
      var node = D.shape(svg, "text", { x: at, y: spTop + 12, "class": "num" }, word);
      var half = (node.getComputedTextLength ? node.getComputedTextLength() : word.length * 7.5) / 2;
      var mid = Math.min(Math.max(at, LEFT + half), wide - RIGHT - half);
      if (keepOut && mid + half > keepOut[0] && mid - half < keepOut[1]) {
        mid = at > (keepOut[0] + keepOut[1]) / 2 ? keepOut[1] + half : keepOut[0] - half;
      }
      node.setAttribute("x", mid.toFixed(1));
      return [mid - half - 6, mid + half + 6];
    }
    if (now.wifi) { keepOut = named(P.words.wifi_name, x((P.wifi_band[0] + P.wifi_band[1]) / 2)); }
    if (now.hop) { named(P.words.bluetooth_name, x((now.hop[0] + now.hop[1]) / 2)); }
    D.shape(svg, "text", { x: 0, y: 0, "class": "num", transform: "translate(14 " + (spTop + SPECTRUM / 2) + ") rotate(-90)" }, P.words.power);
    // The spectrogram: time runs from the top to the bottom.
    for (var ms = 0; ms <= P.length_s * 1000 + 1e-9; ms += 2) {
      if (ms > 0 && ms < P.length_s * 1000) {
        D.shape(svg, "line", { x1: LEFT, y1: y(ms / 1000), x2: wide - RIGHT, y2: y(ms / 1000), stroke: P.colours.grid, "stroke-width": 1 });
      }
      D.shape(svg, "text", { x: LEFT - 6, y: y(ms / 1000) + 4, "class": "end" }, String(ms));
    }
    P.wifi.forEach(function (p) {
      D.shape(svg, "rect", { x: x(P.wifi_band[0]), y: y(p[0]), width: x(P.wifi_band[1]) - x(P.wifi_band[0]), height: y(p[1]) - y(p[0]), fill: P.colours.strong });
    });
    P.bluetooth.forEach(function (h) {
      D.shape(svg, "rect", { x: x(h[2]) - 1, y: y(h[0]), width: Math.max(x(h[3]) - x(h[2]), 3) + 2, height: y(h[1]) - y(h[0]), fill: P.colours.weak });
    });
    D.shape(svg, "rect", { x: LEFT, y: sgTop, width: wide - LEFT - RIGHT, height: ROWS, fill: "none", stroke: P.colours.muted, "stroke-width": 1 });
    D.shape(svg, "text", { x: 0, y: 0, "class": "num", transform: "translate(14 " + (sgTop + ROWS / 2) + ") rotate(-90)" }, P.words.time);
    // The line of the moment, with a pointer at its right end. What it crosses is ringed with ink.
    D.shape(svg, "line", { x1: LEFT, y1: y(t), x2: wide - RIGHT, y2: y(t), stroke: P.colours.ink, "stroke-width": 2 });
    P.wifi.filter(inside).forEach(function (p) {
      D.shape(svg, "rect", { x: x(P.wifi_band[0]), y: y(p[0]), width: x(P.wifi_band[1]) - x(P.wifi_band[0]), height: y(p[1]) - y(p[0]),
        fill: "none", stroke: P.colours.ink, "stroke-width": 2 });
    });
    P.bluetooth.filter(inside).forEach(function (h) {
      D.shape(svg, "rect", { x: x(h[2]) - 3, y: y(h[0]) - 2, width: Math.max(x(h[3]) - x(h[2]), 3) + 6, height: y(h[1]) - y(h[0]) + 4,
        fill: "none", stroke: P.colours.ink, "stroke-width": 2 });
    });
    D.shape(svg, "polygon", { points: [[wide - RIGHT + 1, y(t)], [wide - 1, y(t) - 5], [wide - 1, y(t) + 5]].map(function (p) {
      return p[0].toFixed(1) + "," + p[1].toFixed(1); }).join(" "), fill: P.colours.ink });

    told.textContent = A.told(t, P);
    if (shown) { shown.textContent = A.momentText(t); }
  }

  step.addEventListener("input", draw);
  window.addEventListener("resize", draw);
  draw();
})();
