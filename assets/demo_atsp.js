/* The live picture «Аналого-цифровий перетворювач» on the page of topic 3: figure 3.6 (б) of the chapter with a
   slider that sets how many samples the converter takes. The grey line is the signal, the dots are its samples,
   the dashed line is the slowest wave that passes through all the samples. The numbers come from sampling.js
   (window.RerSampling): this file only draws. The signal, the colours and the words come with the page
   (window.RER_T3.demo.atsp). The picture is drawn point for point (draw.js), so it is drawn again when the
   width of the window changes. */
(function () {
  "use strict";
  var S = window.RerSampling, D = window.RerDraw, P = window.RER_T3.demo.atsp;
  var step = document.getElementById("adc-count");
  var svg = document.getElementById("adc-plot");
  var told = document.getElementById("adc-out");
  var shown = document.getElementById("adc-count-out");
  if (!step || !svg) { return; }

  var SIDE = 14, TOP = 12, AMP = 74, FOOT = 26, COUNT = 1200;

  function draw() {
    var n = Number(step.value);
    var wide = Math.min(D.width(svg), 640), left = SIDE, right = wide - SIDE;
    var mid = TOP + AMP, high = mid + AMP + FOOT, k, t, wave = [], slow = [], got = S.samples(n, P);
    function x(time) { return left + time * (right - left); }

    for (k = 0; k <= COUNT; k += 1) {
      t = k / COUNT;
      wave.push([x(t), mid - AMP * S.signal(t, P)]);
      slow.push([x(t), mid - AMP * S.shown(n, t, P)]);
    }
    D.sheet(svg, wide, high);
    D.shape(svg, "line", { x1: left, y1: mid, x2: right, y2: mid, stroke: P.colours.grid, "stroke-width": 1 });
    D.shape(svg, "path", { d: D.path(wave), fill: "none", stroke: P.colours.signal, "stroke-width": 3.5, "stroke-linejoin": "round" });   // wide, so it shows around the dashed line
    D.shape(svg, "path", { d: D.path(slow), fill: "none", stroke: P.colours.shown, "stroke-width": 2, "stroke-dasharray": "6 5",
      "stroke-linejoin": "round" });
    got[0].forEach(function (time, i) {                // a ring of the colour of the sheet keeps a dot apart from the lines
      D.shape(svg, "circle", { cx: x(time), cy: mid - AMP * got[1][i], r: 5, fill: P.colours.sample, stroke: P.colours.sheet,
        "stroke-width": 2 });
    });
    D.shape(svg, "text", { x: right, y: high - 8, "class": "end" }, P.words.time);

    D.say(told, S.told(n, P));
    if (shown) { shown.textContent = String(n); }
  }

  step.addEventListener("input", draw);
  window.addEventListener("resize", draw);
  draw();
})();
