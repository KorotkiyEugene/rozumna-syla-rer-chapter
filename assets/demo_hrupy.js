/* The live picture of the sorting into groups on the page of topic 8: a map with the places of transmitters
   found during a day. One slider sets how many groups the program looks for, the other the error of a place.
   A circle is a place; its colour and a thin line to the centre say which group the program gave it; a cross is
   the centre of a group, a black diamond is the true place of an object. The first group of an object wears the
   colour of that object, so a colour stays with its object when the sliders move. Every number comes from group.js (window.RerGroup): this file
   only draws. The objects, the limits of the sliders, the colours and the words come with the page
   (window.RER_T8.demo). The picture is drawn point for point (draw.js), so it is drawn again when the width of
   the window changes. */
(function () {
  "use strict";
  var G = window.RerGroup, D = window.RerDraw, P = window.RER_T8.demo;
  var count = document.getElementById("group-count");
  var error = document.getElementById("group-error");
  var svg = document.getElementById("group-plot");
  var told = document.getElementById("group-out");
  var countOut = document.getElementById("group-count-out");
  var errorOut = document.getElementById("group-error-out");
  if (!count || !error || !svg) { return; }

  var EDGE = 6, FOOT = 22;                             // room around the map and for its scale, points of the screen
  var X0 = P.view[0], X1 = P.view[1], Y0 = P.view[2], Y1 = P.view[3];     // the map, kilometres

  function draw() {
    var k = Number(count.value), e = Number(error.value);
    var pts = G.places(P.objects, P.per, e * 1000, P.seed, P.terms);
    var found = G.sort(k, pts), score = G.score(found.group, pts, P.objects.length, k);
    var wide = Math.min(D.width(svg), 640), unit = (wide - 2 * EDGE) / (X1 - X0);
    var small = wide < 480, dot = small ? 3 : 4.5, arm = small ? 8 : 11;       // a telephone gets smaller marks
    var colour = G.colours(score.owner, P.objects.length, P.colours.far).map(function (c) {
      return P.colours.groups[c];
    });
    var high = EDGE + (Y1 - Y0) * unit + FOOT, floor = EDGE + (Y1 - Y0) * unit;
    function x(metres) { return EDGE + (metres / 1000 - X0) * unit; }
    function y(metres) { return floor - (metres / 1000 - Y0) * unit; }

    D.sheet(svg, wide, high);
    D.shape(svg, "rect", { x: EDGE, y: EDGE, width: wide - 2 * EDGE, height: floor - EDGE, fill: P.colours.field,
                           stroke: P.colours.line, "stroke-width": 1 });
    // A thin line ties every place to the centre of its group: a group is told by more than its colour.
    pts.forEach(function (p, i) {
      var c = found.centres[found.group[i]];
      D.shape(svg, "line", { x1: x(p.x), y1: y(p.y), x2: x(c[0]), y2: y(c[1]), stroke: colour[found.group[i]],
                             "stroke-width": 1 });
    });
    // A place that the program gave to a group of another object wears a black ring: these are the places that
    // the sentence under the picture counts. They are drawn after the others, so that no ring is hidden.
    [false, true].forEach(function (wrong) {
      pts.forEach(function (p, i) {
        if ((score.owner[found.group[i]] !== p.object) !== wrong) { return; }
        var mark = D.shape(svg, "circle", { cx: x(p.x), cy: y(p.y), r: dot, fill: colour[found.group[i]],
                                            stroke: wrong ? P.colours.ink : P.colours.field,
                                            "stroke-width": wrong ? 2 : (small ? 1 : 1.5) });
        D.shape(mark, "title", {}, P.words.group + (found.group[i] + 1));   // shown when the pointer rests on the place
      });
    });
    found.centres.forEach(function (c, g) {
      var cx = x(c[0]), cy = y(c[1]);
      [P.colours.field, colour[g]].forEach(function (paint, layer) {
        var thick = layer ? 2.6 : 5.2;                 // a pale rim under the cross keeps it apart from the circles
        D.shape(svg, "line", { x1: cx - arm, y1: cy, x2: cx + arm, y2: cy, stroke: paint, "stroke-width": thick });
        D.shape(svg, "line", { x1: cx, y1: cy - arm, x2: cx, y2: cy + arm, stroke: paint, "stroke-width": thick });
      });
    });
    // The true places lie on top: at a small error a centre stands almost on its object, the diamond stays in
    // sight and the arms of the cross reach out of it.
    P.objects.forEach(function (o) {
      var cx = x(o[0]), cy = y(o[1]), half = small ? 4 : 5;
      D.shape(svg, "path", { d: D.path([[cx, cy - half], [cx + half, cy], [cx, cy + half], [cx - half, cy]]) + " Z",
                             fill: P.colours.ink, stroke: P.colours.field, "stroke-width": 1.5 });
    });
    // The scale of the map: a stroke of ten kilometres.
    D.shape(svg, "line", { x1: EDGE, y1: floor + 9, x2: EDGE + 10 * unit, y2: floor + 9, stroke: P.colours.ink, "stroke-width": 2 });
    D.shape(svg, "text", { x: EDGE + 10 * unit + 6, y: floor + 13 }, P.words.scale);

    D.say(told, G.told(score.merged, score.split, pts.length - score.right, pts.length, P.words.told));
    if (countOut) { countOut.textContent = k; }
    if (errorOut) { errorOut.textContent = D.number(e, 1); }
  }

  count.addEventListener("input", draw);
  error.addEventListener("input", draw);
  window.addEventListener("resize", draw);
  draw();
})();
