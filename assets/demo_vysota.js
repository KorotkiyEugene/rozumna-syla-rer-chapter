/* The live picture «Висота антени і дальність» on the page of topic 1: figure 1.2 of the chapter with a slider
   that sets the height of the antenna of the receiver. The picture is a cut through the Earth: the ground falls
   away from the foot of the receiver, the dashed line runs straight from its antenna, touches the ground and
   ends at the antenna of the farthest transmitter that is still heard. A scale of heights stands at the left. Heights are drawn larger than distances,
   in one scale for every position of the slider, so a higher antenna is seen to stand higher. The numbers come
   from reach.js (window.RerReach): this file only draws. The heights, the colours and the words come with the
   page (window.RER_T1.reach). The picture is drawn point for point (draw.js), so it is drawn again when the
   width of the window changes. */
(function () {
  "use strict";
  var R = window.RerReach, D = window.RerDraw, P = window.RER_T1.reach;
  var step = document.getElementById("reach-step");
  var svg = document.getElementById("reach-plot");
  var told = document.getElementById("reach-out");
  var shown = document.getElementById("reach-step-out");
  if (!step || !svg) { return; }

  var LEFT = 52, SIDE = 14, TOP = 24, HIGH = 250, FOOT = 26, COUNT = 300, ROOM = 0.12, CLOSE = 80;
  var top = P.heights_m[P.heights_m.length - 1], drop = R.surface(P.axis_m, P);    // the highest and the lowest point, metres
  var low = drop - ROOM * (top - drop);                                            // some ground stays under the far end

  function draw() {
    var h = P.heights_m[Number(step.value)], far = R.reach(h, P);
    var wide = Math.min(D.width(svg), 640), left = LEFT, right = wide - SIDE, bottom = TOP + HIGH, k, at, ground = [];
    function x(metres) { return left + metres / P.axis_m * (right - left); }
    function y(metres) { return TOP + (top - metres) / (top - low) * HIGH; }

    for (k = 0; k <= COUNT; k += 1) {
      at = P.axis_m * k / COUNT;
      ground.push([x(at), y(R.surface(at, P))]);
    }
    D.sheet(svg, wide, bottom + FOOT);
    // The Earth.
    D.shape(svg, "path", { d: D.path(ground.concat([[right, bottom], [left, bottom]])) + " Z", fill: P.colours.ground });
    D.shape(svg, "path", { d: D.path(ground), fill: "none", stroke: P.colours.surface, "stroke-width": 1.5 });
    // The scale of heights: it stands where the receiver stands.
    D.shape(svg, "line", { x1: left, y1: y(0), x2: left, y2: y(top), stroke: P.colours.surface, "stroke-width": 1 });
    P.rise_ticks_m.forEach(function (rise) {
      D.shape(svg, "line", { x1: left - 4, y1: y(rise), x2: left, y2: y(rise), stroke: P.colours.surface, "stroke-width": 1 });
      D.shape(svg, "text", { x: left - 7, y: y(rise) + 4, "class": "end" }, rise.toFixed(0) + (rise > 0 ? " " + P.words.metre : ""));
    });
    // The farthest transmitter that is still heard, and the straight line between the two antennas.
    var tx = x(far), ty = y(R.surface(far, P)), near = tx > 0.72 * wide, close = tx - left < CLOSE;
    D.shape(svg, "line", { x1: x(0), y1: y(h), x2: tx, y2: y(R.line(h, far, P)), stroke: P.colours.line,
      "stroke-width": 1.5, "stroke-dasharray": "6 4" });
    // The mast of the receiver and its antenna.
    D.shape(svg, "line", { x1: x(0), y1: y(0), x2: x(0), y2: y(h), stroke: P.colours.receiver, "stroke-width": 3 });
    D.shape(svg, "rect", { x: x(0) - 4, y: y(h) - 4, width: 8, height: 8, fill: P.colours.receiver });
    D.shape(svg, "text", { x: x(0) + 9, y: y(h) - (close ? 26 : 8) }, h.toFixed(0) + " " + P.words.metre);
    D.shape(svg, "circle", { cx: tx, cy: ty, r: 5.5, fill: P.colours.transmitter, stroke: P.colours.sheet, "stroke-width": 2 });
    D.shape(svg, "text", { x: near ? tx - 10 : tx + 10, y: near ? ty + 22 : ty - 9, "class": near ? "end strong" : "strong" },
      P.words.to + " " + R.number(far / 1000) + " " + P.words.km);
    // The scale of distances along the ground.
    D.shape(svg, "line", { x1: left, y1: bottom, x2: right, y2: bottom, stroke: P.colours.surface, "stroke-width": 1 });
    for (k = 0; k <= P.axis_m; k += P.tick_m) {
      D.shape(svg, "line", { x1: x(k), y1: bottom, x2: x(k), y2: bottom + 4, stroke: P.colours.surface, "stroke-width": 1 });
      D.shape(svg, "text", { x: x(k), y: bottom + 18, "class": k >= P.axis_m ? "end" : (k === 0 ? "" : "num") },
        (k / 1000).toFixed(0) + (k >= P.axis_m ? " " + P.words.km : ""));
    }

    D.say(told, R.told(h, P));
    if (shown) { shown.textContent = h.toFixed(0); }
  }

  step.addEventListener("input", draw);
  window.addEventListener("resize", draw);
  draw();
})();
