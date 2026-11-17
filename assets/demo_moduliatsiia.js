/* The live picture «Модуляція» on the page of topic 2: figure 2.3 of the chapter with a list that chooses the
   way of modulation and a slider that makes the message stronger or weaker. Above stands the message, below
   the radio wave that carries it, on one axis of time. With amplitude modulation a dashed line shows the
   amplitude of the wave, as in the figure. The numbers come from modulation.js (window.RerModulation): this
   file only draws. The constants of the figure, the colours and the words come with the page
   (window.RER_T2.modulation). The picture is drawn point for point (draw.js), so it is drawn again when the
   width of the window changes. */
(function () {
  "use strict";
  var M = window.RerModulation, D = window.RerDraw, P = window.RER_T2.modulation;
  var way = document.getElementById("mod-way");
  var step = document.getElementById("mod-strength");
  var svg = document.getElementById("mod-plot");
  var told = document.getElementById("mod-out");
  var shown = document.getElementById("mod-strength-out");
  if (!way || !step || !svg) { return; }

  var SIDE = 14, WORDS = 22, MESSAGE = 26, GAP = 12, WAVE = 68, FOOT = 8, COUNT = 1600;
  var UNIT = WAVE / P.room;                            // the amplitude of the wave without a message, in points of the screen

  function draw() {
    var s = Number(step.value) / P.steps, how = way.value;
    var wide = Math.min(D.width(svg), 640), left = SIDE, right = wide - SIDE;
    var midA = WORDS + MESSAGE, midB = midA + MESSAGE + GAP + WORDS + WAVE, high = midB + WAVE + FOOT;
    var k, t, line = [], upper = [], lower = [], carried = [];
    function x(time) { return left + time * (right - left); }

    for (k = 0; k <= COUNT; k += 1) {
      t = k / COUNT;
      line.push([x(t), midA - MESSAGE * M.message(t, s, P)]);
      carried.push([x(t), midB - UNIT * M.wave(how, t, s, P)]);
      upper.push([x(t), midB - UNIT * M.outline(t, s, P)]);
      lower.push([x(t), midB + UNIT * M.outline(t, s, P)]);
    }
    D.sheet(svg, wide, high);
    // Above: the message.
    D.shape(svg, "line", { x1: left, y1: midA, x2: right, y2: midA, stroke: P.colours.grid, "stroke-width": 1 });
    D.shape(svg, "path", { d: D.path(line), fill: "none", stroke: P.colours.message, "stroke-width": 2.5, "stroke-linejoin": "round" });
    D.shape(svg, "text", { x: left, y: 12 }, P.words.message);
    // Below: the radio wave that carries it.
    D.shape(svg, "line", { x1: left, y1: midB, x2: right, y2: midB, stroke: P.colours.grid, "stroke-width": 1 });
    D.shape(svg, "path", { d: D.path(carried), fill: "none", stroke: P.colours.wave, "stroke-width": 1.5, "stroke-linejoin": "round" });
    if (how === "am" && s > 0) {                       // the amplitude that follows the message, as in the figure
      [upper, lower].forEach(function (points) {
        D.shape(svg, "path", { d: D.path(points), fill: "none", stroke: P.colours.message, "stroke-width": 1.2, "stroke-dasharray": "4 3" });
      });
    }
    D.shape(svg, "text", { x: left, y: midA + MESSAGE + GAP + 12 }, s > 0 ? P.words.wave : P.words.plain);

    D.say(told, M.told(how, s, P));
    if (shown) { shown.textContent = (100 * s).toFixed(0); }
  }

  way.addEventListener("input", draw);
  way.addEventListener("change", draw);
  step.addEventListener("input", draw);
  window.addEventListener("resize", draw);
  draw();
})();
