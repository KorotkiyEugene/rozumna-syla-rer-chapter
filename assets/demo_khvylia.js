/* The live picture «Частота і довжина хвилі» on the page of topic 2: the ruler and the person of figure 2.1 (б)
   of the chapter and one wave over them, drawn in their scale. The slider sets the frequency of the wave. Every
   number comes from wave.js (window.RerWave): this file only draws. The steps of the slider, the colours and the
   words come with the page (window.RER_T2.wave). The picture is drawn point for point (draw.js), so it is drawn
   again when the width of the window changes. */
(function () {
  "use strict";
  var W = window.RerWave, D = window.RerDraw, P = window.RER_T2.wave;
  var step = document.getElementById("wave-step");
  var svg = document.getElementById("wave-plot");
  var told = document.getElementById("wave-out");
  var shown = document.getElementById("wave-step-out");
  if (!step || !svg) { return; }

  var RIGHT = 14, TOP = 26, BOTTOM = 24;               // room for the label above the wave and the numbers of the ruler

  // The person of the figure: a pictogram as tall as P.person_m metres, standing on the line of the ruler.
  function person(cx, floor, metre) {
    var high = P.person_m * metre, u = high / 0.96;    // the pictogram fills 0.96 of the side of its square
    function part(x0, y0, x1, y1, r) {                 // a rounded bar between two corners, in parts of the square
      D.shape(svg, "rect", { x: cx + x0 * u, y: floor - (y1 + 0.48) * u, width: (x1 - x0) * u, height: (y1 - y0) * u,
                             rx: r * u, fill: P.colours.person });
    }
    D.shape(svg, "circle", { cx: cx, cy: floor - (0.37 + 0.48) * u, r: 0.11 * u, fill: P.colours.person });
    part(-0.15, -0.10, 0.15, 0.22, 0.08);              // the body
    part(-0.24, -0.08, -0.17, 0.20, 0.035);            // the arms
    part(0.17, -0.08, 0.24, 0.20, 0.035);
    part(-0.14, -0.48, -0.015, -0.02, 0.035);          // the legs
    part(0.015, -0.48, 0.14, -0.02, 0.035);
  }

  function draw() {
    var f = P.steps_hz[Number(step.value)], length = W.wavelength(f, P.rule_m_hz);
    var wide = Math.min(D.width(svg), 640), small = wide < 480;
    var left = small ? 40 : 56;                        // room for the person at the left of the ruler
    var metre = (wide - left - RIGHT) / P.ruler_m;     // points of the screen in one metre
    var amp = 0.42 * metre, mid = TOP + amp + 4;       // the wave swings around this line
    var floor = mid + amp + Math.max(P.person_m * metre - 2 * amp, 0) + 14, high = floor + BOTTOM;
    function x(m) { return left + m * metre; }

    D.sheet(svg, wide, high);
    // The wave: enough points for the shortest wave of the slider.
    var count = 1200, hs = W.heights(f, P.rule_m_hz, P.ruler_m, count);
    D.shape(svg, "path", { d: D.path(hs.map(function (h, k) { return [x(P.ruler_m * k / count), mid - amp * h]; })),
                           fill: "none", stroke: P.colours.wave, "stroke-width": 2, "stroke-linejoin": "round" });
    // One wavelength, marked above the wave from the zero of the ruler.
    var end = x(Math.min(length, P.ruler_m)), y = TOP - 8;
    D.shape(svg, "line", { x1: x(0), y1: y, x2: end, y2: y, stroke: P.colours.ink, "stroke-width": 1.2 });
    [x(0), end].forEach(function (at) {
      D.shape(svg, "line", { x1: at, y1: y - 4, x2: at, y2: y + 4, stroke: P.colours.ink, "stroke-width": 1.2 });
    });
    D.shape(svg, "text", { x: x(0), y: y - 7 }, P.words.length + " " + W.lengthText(length));
    // The ruler in metres and the person beside it.
    D.shape(svg, "line", { x1: x(0), y1: floor, x2: x(P.ruler_m), y2: floor, stroke: P.colours.ink, "stroke-width": 1.5 });
    for (var k = 0; k <= P.ruler_m; k += 1) {
      D.shape(svg, "line", { x1: x(k), y1: floor - 5, x2: x(k), y2: floor + 5, stroke: P.colours.ink, "stroke-width": 1.2 });
      D.shape(svg, "text", { x: x(k), y: floor + 19, "class": "num" }, k < P.ruler_m ? String(k) : k + " " + P.words.metre);
    }
    person(left / 2 - 2, floor, metre);

    D.say(told, W.told(f, P));
    if (shown) { shown.textContent = (f / 1e6).toFixed(0); }
  }

  step.addEventListener("input", draw);
  window.addEventListener("resize", draw);
  draw();
})();
