/* The live picture «Фільтр і перетворювач частоти» on the page of topic 3: figure 3.2 (б) of the chapter with a
   slider that tunes the receiver. Above stand the signals at the antenna and the band of the filter. Below, the
   same band is shown large, as it goes on to the converter: every signal higher, the frequencies counted from
   zero. The two parts have one scale of height, so the work of the amplifier is seen. The numbers come from
   front.js (window.RerFront): this file only draws. The signals, the colours and the words come with the page
   (window.RER_T3.demo.radiochastyna). The picture is drawn point for point (draw.js), so it is drawn again when
   the width of the window changes. */
(function () {
  "use strict";
  var F = window.RerFront, D = window.RerDraw, P = window.RER_T3.demo.radiochastyna;
  var step = document.getElementById("front-step");
  var svg = document.getElementById("front-plot");
  var told = document.getElementById("front-out");
  var shown = document.getElementById("front-step-out");
  if (!step || !svg) { return; }

  var SIDE = 14, TOP = 40, UNIT = 7.6;                 // a point of height of the drawing takes UNIT points of the screen
  var ABOVE = Math.round(P.room_above * UNIT) + 6, FUNNEL = 70, LABELS = 22, BELOW = Math.round(P.room * UNIT) + 6, FOOT = 24;

  function draw() {
    var c = P.centres[Number(step.value)], b = F.band(c, P);
    var wide = Math.min(D.width(svg), 640), high = TOP + ABOVE + FUNNEL + BELOW + FOOT;
    var upBase = TOP + ABOVE, lowTop = upBase + FUNNEL, lowBase = lowTop + BELOW;
    var left = SIDE, right = wide - SIDE, i, f, points;
    function x(freq) { return left + (freq - P.axis[0]) / (P.axis[1] - P.axis[0]) * (right - left); }
    function xb(inside) { return left + inside / P.band_hz * (right - left); }

    D.sheet(svg, wide, high);
    // Above: the signals at the antenna and the band of the filter.
    D.shape(svg, "rect", { x: x(b[0]), y: TOP, width: x(b[1]) - x(b[0]), height: ABOVE, fill: P.colours.band_pale,
      stroke: P.colours.band, "stroke-width": 1.5 });
    points = [];
    for (i = 0; i <= 800; i += 1) {
      f = P.axis[0] + i / 800 * (P.axis[1] - P.axis[0]);
      points.push([x(f), upBase - F.curve(f, P) * UNIT]);
    }
    D.shape(svg, "path", { d: D.path([[left, upBase]].concat(points, [[right, upBase]])) + " Z", fill: P.colours.signal_pale });
    D.shape(svg, "path", { d: D.path(points), fill: "none", stroke: P.colours.signal, "stroke-width": 1.5, "stroke-linejoin": "round" });
    D.shape(svg, "line", { x1: left, y1: upBase, x2: right, y2: upBase, stroke: P.colours.muted, "stroke-width": 1 });
    // The funnel: the band of the filter is the whole lower part. Its lines begin under the numbers of the axis,
    // straight below the edges of the frame, so they cross no number.
    [[x(b[0]), left], [x(b[1]), right]].forEach(function (pair) {
      D.shape(svg, "line", { x1: pair[0], y1: upBase + LABELS, x2: pair[1], y2: lowTop, stroke: P.colours.band, "stroke-width": 1 });
    });
    D.shape(svg, "text", { x: left, y: 12 }, P.words.above);
    D.shape(svg, "text", { x: x((P.broadcast[0] + P.broadcast[1]) / 2), y: TOP - 6, "class": "num" }, P.words.broadcast);
    for (f = P.axis[0]; f <= P.axis[1] + 1; f += P.tick_hz) {
      D.shape(svg, "line", { x1: x(f), y1: upBase, x2: x(f), y2: upBase + 4, stroke: P.colours.muted, "stroke-width": 1 });
      D.shape(svg, "text", { x: x(f), y: upBase + 17, "class": f >= P.axis[1] ? "end" : (f <= P.axis[0] ? "" : "num") },
        (f / 1e6).toFixed(0) + (f >= P.axis[1] ? " " + P.words.unit : ""));
    }
    // Below: the band on its way to the converter, every signal higher, the frequencies counted from zero.
    D.shape(svg, "rect", { x: left, y: lowTop, width: right - left, height: BELOW, fill: "none", stroke: P.colours.band, "stroke-width": 1.5 });
    points = [];
    for (i = 0; i <= 400; i += 1) {
      points.push([xb(i / 400 * P.band_hz), lowBase - Math.min(F.moved(c, i / 400 * P.band_hz, P), P.room) * UNIT]);
    }
    D.shape(svg, "path", { d: D.path([[left, lowBase]].concat(points, [[right, lowBase]])) + " Z", fill: P.colours.band_pale });
    D.shape(svg, "path", { d: D.path(points), fill: "none", stroke: P.colours.band, "stroke-width": 2, "stroke-linejoin": "round" });
    for (i = 0; i <= 4; i += 1) {
      f = i / 4 * P.band_hz;
      D.shape(svg, "line", { x1: xb(f), y1: lowBase, x2: xb(f), y2: lowBase + 4, stroke: P.colours.muted, "stroke-width": 1 });
      D.shape(svg, "text", { x: xb(f), y: lowBase + 17, "class": i === 4 ? "end" : (i === 0 ? "" : "num") },
        (f / 1e6).toFixed(0) + (i === 4 ? " " + P.words.unit : ""));
    }
    // The words stand in the middle between the two lines of the funnel, at the height of the words.
    var up = 10 / (FUNNEL - LABELS);
    D.shape(svg, "text", { x: (left + right) / 2 + up * (x(b[0]) + x(b[1]) - left - right) / 2, y: lowTop - 6, "class": "num" },
      P.words.below);

    D.say(told, F.told(c, P));
    if (shown) { shown.textContent = (c / 1e6).toFixed(0); }
  }

  step.addEventListener("input", draw);
  window.addEventListener("resize", draw);
  draw();
})();
