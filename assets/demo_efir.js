/* The live picture «Справжній ефір» on the page of topic 2: figure 2.5 of the chapter with a line of the moment
   that the slider leads down the spectrogram of a real recording, and above it the spectrum of that moment. The
   rows of the spectrum come from ether.js (window.RerEther): this file only draws. The recordings, the colours
   and the words come with the page (window.RER_T2.ether), and the spectrogram of a recording is a picture beside
   the page. The picture is drawn point for point (draw.js), so it is drawn again when the width of the window
   changes. */
(function () {
  "use strict";
  var E = window.RerEther, D = window.RerDraw, P = window.RER_T2.ether;
  var choice = document.getElementById("ether-record");
  var step = document.getElementById("ether-step");
  var svg = document.getElementById("ether-plot");
  var told = document.getElementById("ether-out");
  var shown = document.getElementById("ether-step-out");
  var unit = document.getElementById("ether-unit");
  if (!step || !svg || !choice) { return; }

  var LEFT = 46, RIGHT = 12, TOP = 38;                 // room for the names and the numbers of the axes
  var SPECTRUM = 84, GAP = 18, ROWS = 240, BOTTOM = 8;  // the heights of the two panels, points of the screen
  var bytes = P.records.map(function (r) { return E.decode(r.levels); });

  function comma(x, digits) { return x.toFixed(digits).replace(".", ","); }

  function draw() {
    var r = P.records[Number(choice.value)], k = Math.min(Number(step.value), r.rows - 1);
    var levels = E.row(bytes[Number(choice.value)], r.bins, k), t = r.times[k];
    var wide = Math.min(D.width(svg), 640), high = TOP + SPECTRUM + GAP + ROWS + BOTTOM;
    var spTop = TOP, spBot = TOP + SPECTRUM, sgTop = spBot + GAP, sgBot = sgTop + ROWS;
    function x(f) { return LEFT + (f - r.f_from) / (r.f_to - r.f_from) * (wide - LEFT - RIGHT); }
    function y(s) { return sgTop + s / r.shown_s * ROWS; }

    D.sheet(svg, wide, high);
    // The axis of frequency stands above both panels, as in the figure.
    D.shape(svg, "text", { x: LEFT + (wide - LEFT - RIGHT) / 2, y: 12, "class": "num" }, P.words.frequency);
    r.ticks_hz.forEach(function (f) {
      D.shape(svg, "line", { x1: x(f), y1: spTop - 4, x2: x(f), y2: sgBot, stroke: P.colours.grid, "stroke-width": 1 });
      D.shape(svg, "text", { x: x(f), y: spTop - 8, "class": "num" }, comma(f / 1e6, r.tick_digits));
    });
    // The spectrum of the moment: a level for every frequency of the row.
    var points = [], i, cell = (r.f_to - r.f_from) / r.bins;
    for (i = 0; i < r.bins; i += 1) {
      points.push([x(r.f_from + (i + 0.5) * cell), spBot - levels[i] / 255 * SPECTRUM]);
    }
    D.shape(svg, "path", { d: D.path([[points[0][0], spBot]].concat(points, [[points[r.bins - 1][0], spBot]])) + " Z", fill: P.colours.pale });
    D.shape(svg, "path", { d: D.path(points), fill: "none", stroke: P.colours.strong, "stroke-width": 1.5, "stroke-linejoin": "round" });
    D.shape(svg, "line", { x1: LEFT, y1: spBot, x2: wide - RIGHT, y2: spBot, stroke: P.colours.muted, "stroke-width": 1 });
    D.shape(svg, "text", { x: 0, y: 0, "class": "num", transform: "translate(14 " + (spTop + SPECTRUM / 2) + ") rotate(-90)" }, P.words.power);
    // The spectrogram: the picture of the recording. Time runs from the top to the bottom.
    var ticks = Math.round(r.shown_s / r.t_step_s), n;
    for (n = 0; n <= ticks; n += 1) {
      if (n > 0 && n < ticks) {
        D.shape(svg, "line", { x1: LEFT, y1: y(n * r.t_step_s), x2: wide - RIGHT, y2: y(n * r.t_step_s), stroke: P.colours.grid, "stroke-width": 1 });
      }
      D.shape(svg, "text", { x: LEFT - 6, y: y(n * r.t_step_s) + 4, "class": "end" }, comma(n * r.t_step_s / r.scale, 0));
    }
    // The line of the moment lies under the picture, as in the figure: a packet is thin, and the line must not hide it.
    D.shape(svg, "line", { x1: LEFT, y1: y(t), x2: wide - RIGHT, y2: y(t), stroke: P.colours.ink, "stroke-width": 1.5 });
    D.shape(svg, "image", { href: r.picture, x: LEFT, y: sgTop, width: wide - LEFT - RIGHT, height: ROWS, preserveAspectRatio: "none",
      style: "image-rendering: pixelated" });
    D.shape(svg, "rect", { x: LEFT, y: sgTop, width: wide - LEFT - RIGHT, height: ROWS, fill: "none", stroke: P.colours.muted, "stroke-width": 1 });
    D.shape(svg, "text", { x: 0, y: 0, "class": "num", transform: "translate(14 " + (sgTop + ROWS / 2) + ") rotate(-90)" },
      P.words.time + r.unit);
    // The pointer at the right end of the line of the moment.
    D.shape(svg, "polygon", { points: [[wide - RIGHT + 1, y(t)], [wide - 1, y(t) - 5], [wide - 1, y(t) + 5]].map(function (p) {
      return p[0].toFixed(1) + "," + p[1].toFixed(1); }).join(" "), fill: P.colours.ink });

    D.say(told, E.told(r, k, P.words));
    if (shown) { shown.textContent = E.momentText(r, k); }
    if (unit) { unit.textContent = P.words.label + r.unit; }
  }

  // Another recording has its own rows: the slider takes their number and opens at the moment of the figure.
  choice.addEventListener("input", function () {
    var r = P.records[Number(choice.value)];
    step.max = String(r.rows - 1);
    step.value = String(r.start);
    draw();
  });
  step.addEventListener("input", draw);
  window.addEventListener("resize", draw);
  draw();
})();
