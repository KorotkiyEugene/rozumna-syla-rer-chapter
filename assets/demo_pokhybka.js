/* The live picture of the error of a bearing on the page of topic 6: two posts, their bearings on one
   transmitter and the area where the transmitter may be. One slider sets the error of a bearing, the other the
   angle at which the bearings cross. Every number comes from fix.js (window.RerFix): this file only draws. The
   scene, the limits of the sliders, the colours and the words come with the page (window.RER_T6.demo). The
   picture is drawn point for point (draw.js), so it is drawn again when the width of the window changes. */
(function () {
  "use strict";
  var F = window.RerFix, D = window.RerDraw, P = window.RER_T6.demo;
  var error = document.getElementById("fix-error");
  var angle = document.getElementById("fix-angle");
  var svg = document.getElementById("fix-plot");
  var told = document.getElementById("fix-out");
  var errorOut = document.getElementById("fix-error-out");
  var angleOut = document.getElementById("fix-angle-out");
  if (!error || !angle || !svg) { return; }

  var FAR = 200;                       // kilometres: a line and a sector are drawn this far, beyond the picture
  var RAD = Math.PI / 180;

  function draw() {
    var e = Number(error.value), a = Number(angle.value);
    var one = F.first(P.point, P.reach), two = F.second(P.point, P.reach, a);
    var found = F.area(one, two, P.point, e);
    var x0 = P.box.x[0], x1 = P.box.x[1], y0 = P.box.y[0], y1 = P.box.y[1];
    var wide = Math.min(D.width(svg), 560), unit = wide / (x1 - x0), high = Math.round(unit * (y1 - y0));
    function x(km) { return (km - x0) * unit; }
    function y(km) { return (y1 - km) * unit; }
    function at(p) { return [x(p[0]), y(p[1])]; }
    function along(post, az, far) { return [post[0] + far * Math.sin(az * RAD), post[1] + far * Math.cos(az * RAD)]; }
    function points(list) {
      return list.map(function (p) { var q = at(p); return q[0].toFixed(1) + "," + q[1].toFixed(1); }).join(" ");
    }

    D.sheet(svg, wide, high);
    D.shape(svg, "rect", { x: 0.5, y: 0.5, width: wide - 1, height: high - 1, "class": "grid", fill: "#f7f8f8" });
    var k;
    for (k = Math.ceil(x0 / P.grid) * P.grid; k < x1; k += P.grid) {
      D.shape(svg, "line", { x1: x(k), y1: 0, x2: x(k), y2: high, "class": "grid" });
    }
    for (k = Math.ceil(y0 / P.grid) * P.grid; k < y1; k += P.grid) {
      D.shape(svg, "line", { x1: 0, y1: y(k), x2: wide, y2: y(k), "class": "grid" });
    }

    // The sector of each post in a flat pale colour, then the area where the two sectors overlap, then the lines.
    // Every shape is cut at the edges of the picture (fix.js) before it is drawn.
    [[one, P.colours.onePale], [two, P.colours.twoPale]].forEach(function (s) {
      var az = F.bearing(s[0], P.point);
      var sector = F.cutPolygon([s[0], along(s[0], az - e, FAR), along(s[0], az + e, FAR)], P.box);
      D.shape(svg, "polygon", { points: points(sector), fill: s[1] });
    });
    D.shape(svg, "polygon", { points: points(F.cutPolygon(found.corners, P.box)), fill: P.colours.area,
                              stroke: P.colours.edge, "stroke-width": 1.5, "stroke-linejoin": "round" });
    [[one, P.colours.one], [two, P.colours.two]].forEach(function (s) {
      var seen = F.cutSegment(s[0], along(s[0], F.bearing(s[0], P.point), FAR), P.box);
      if (!seen) { return; }
      var p = at(seen[0]), q = at(seen[1]);
      D.shape(svg, "line", { x1: p[0], y1: p[1], x2: q[0], y2: q[1], stroke: s[1], "stroke-width": 1.5 });
    });

    // The posts, the transmitter and their names. The name of the first post stands under it; the names of the
    // second post and of the transmitter stand where no bearing passes (fix.js).
    var second = F.secondLabel(a);
    [[one, P.colours.one, P.words.one, { dx: 0, dy: 20, anchor: "middle" }],
     [two, P.colours.two, P.words.two, second]].forEach(function (s) {
      var p = at(s[0]);
      D.shape(svg, "rect", { x: p[0] - 5, y: p[1] - 5, width: 10, height: 10, fill: s[1], stroke: "#fff", "stroke-width": 1.5 });
      D.shape(svg, "text", { x: p[0] + s[3].dx, y: p[1] + s[3].dy, "text-anchor": s[3].anchor }, s[2]);
    });
    // The transmitter is a cross of two thin strokes: a filled mark would hide a small area.
    var t = at(P.point), arm = 5;
    [[-1, -1, 1, 1], [-1, 1, 1, -1]].forEach(function (k) {
      D.shape(svg, "line", { x1: t[0] + k[0] * arm, y1: t[1] + k[1] * arm, x2: t[0] + k[2] * arm, y2: t[1] + k[3] * arm,
                             stroke: P.colours.transmitter, "stroke-width": 1.6, "stroke-linecap": "round" });
    });
    var name = F.transmitterLabel(a, Math.min(found.size * unit / 4, 40));
    D.shape(svg, "text", { x: t[0] + name[0], y: t[1] + name[1] + 4 }, P.words.transmitter);

    // The scale: a stroke of one square of the grid.
    var sx = x(x1 - P.grid - 1), sy = y(y0 + 1.2);
    D.shape(svg, "line", { x1: sx, y1: sy, x2: sx + P.grid * unit, y2: sy, stroke: "#1f2a2e", "stroke-width": 2 });
    D.shape(svg, "text", { x: sx + P.grid * unit / 2, y: sy - 6, "class": "num" }, P.words.scale);

    told.textContent = F.sizeText(found.size, P.words.size);
    if (errorOut) { errorOut.textContent = e + P.words.degree; }
    if (angleOut) { angleOut.textContent = a + P.words.degree; }
  }

  error.addEventListener("input", draw);
  angle.addEventListener("input", draw);
  window.addEventListener("resize", draw);
  draw();
})();
