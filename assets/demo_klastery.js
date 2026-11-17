/* The live picture of grouping on the page of topic 5: the points of figure 5.3 of the chapter and one slider
   that sets how far apart two points may lie and still be neighbours. Every count comes from clusters.js
   (window.RerClusters): this file only draws. The points, the reach of the figure and the words come with the
   page (window.RER_T5.demo). The picture is drawn point for point (draw.js), so it is drawn again when the width
   of the window changes. */
(function () {
  "use strict";
  var C = window.RerClusters, D = window.RerDraw, P = window.RER_T5.demo;
  var input = document.getElementById("cluster-reach");
  var svg = document.getElementById("cluster-plot");
  var told = document.getElementById("cluster-out");
  var reach = document.getElementById("cluster-reach-out");
  if (!input || !svg) { return; }

  var LEFT = 46, RIGHT = 8, TOP = 8, BOTTOM = 40;      // points of the screen around the plot
  var PALE = 0.8;                                      // the share of white in the colour of a disc

  function draw() {
    var k = C.factor(Number(input.value), P.low, P.high, P.steps);
    var near = [P.near[0] * k, P.near[1] * k];
    var found = C.groups(P.points, near, P.least), counted = C.count(found);
    var wide = Math.min(D.width(svg), 640);
    var f0 = P.axes.f[0], f1 = P.axes.f[1], w0 = P.axes.width[0], w1 = P.axes.width[1];
    // One reach of the figure takes the same length along both axes, so a reach is a circle on the screen.
    var unit = (wide - LEFT - RIGHT) / ((f1 - f0) / P.near[0]);
    var pw = wide - LEFT - RIGHT, ph = unit * (w1 - w0) / P.near[1], high = TOP + ph + BOTTOM;
    function x(f) { return LEFT + (f - f0) / (f1 - f0) * pw; }
    function y(w) { return TOP + ph - (w - w0) / (w1 - w0) * ph; }
    function colour(g) { return g < 0 ? P.alone : P.colours[g % P.colours.length]; }
    // a point is small enough to leave its disc visible at the shortest reach and in a narrow window
    var dot = C.dot(unit);
    D.sheet(svg, wide, high);
    var defs = D.shape(svg, "defs", {});
    var clip = D.shape(defs, "clipPath", { id: "cluster-box" });
    D.shape(clip, "rect", { x: LEFT, y: TOP, width: pw, height: ph });
    D.shape(svg, "rect", { x: LEFT, y: TOP, width: pw, height: ph, "class": "grid", fill: "#f7f8f8" });

    // the discs: a point has half of the reach around it, so two points are neighbours when their discs touch.
    // A disc has a flat pale colour, so the discs of one group do not darken where they overlap. The discs of
    // the points without a group are drawn first: a group is never hidden under them.
    var discs = D.shape(svg, "g", { "clip-path": "url(#cluster-box)" });
    [true, false].forEach(function (alone) {
      found.forEach(function (g, i) {
        if ((g < 0) !== alone) { return; }
        D.shape(discs, "circle", { cx: x(P.points[i][0]).toFixed(1), cy: y(P.points[i][1]).toFixed(1),
                                   r: (unit * k / 2).toFixed(1), fill: C.tint(colour(g), PALE) });
      });
    });
    found.forEach(function (g, i) {
      D.shape(svg, "circle", { cx: x(P.points[i][0]).toFixed(1), cy: y(P.points[i][1]).toFixed(1), r: dot.toFixed(1),
                               fill: g < 0 ? "#fff" : colour(g), stroke: colour(g), "stroke-width": dot > 2 ? 1.4 : 1 });
    });

    P.ticks.f.forEach(function (f) {
      D.shape(svg, "line", { x1: x(f), y1: TOP + ph, x2: x(f), y2: TOP + ph + 5, "class": "grid" });
      D.shape(svg, "text", { x: x(f), y: TOP + ph + 18, "class": "num" }, D.number(f, 0));
    });
    P.ticks.width.forEach(function (w) {
      D.shape(svg, "line", { x1: LEFT - 5, y1: y(w), x2: LEFT, y2: y(w), "class": "grid" });
      D.shape(svg, "text", { x: LEFT - 8, y: y(w) + 4, "text-anchor": "end" }, D.number(w, 1).replace(/^(\d+)$/, "$1,0"));
    });
    D.shape(svg, "text", { x: LEFT + pw / 2, y: high - 6, "class": "num" }, P.words.f);
    D.shape(svg, "text", { x: 12, y: TOP + ph / 2, "class": "num", transform: "rotate(-90 12 " + (TOP + ph / 2) + ")" },
            P.words.width);
    D.say(told, P.words.groups + counted[0] + P.words.alone + counted[1] + ".");
    if (reach) { reach.textContent = C.reachText(P.near, k, P.words); }
  }

  input.addEventListener("input", draw);
  window.addEventListener("resize", draw);
  draw();
})();
