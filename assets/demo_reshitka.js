/* The live picture of an antenna array on the page of topic 3: panels (в) and (г) of figure 3.5 of the chapter,
   moved by three sliders. Every number of the array comes from array.js (window.RerArray): this file holds no
   formula of the array, it only draws. The words inside the pictures come with the page
   (window.RER_T3.demo.reshitka.words). A picture is drawn point for point (draw.js), so all four are drawn
   again when the width of the window changes. */
(function () {
  "use strict";
  var A = window.RerArray, D = window.RerDraw, WORDS = window.RER_T3.demo.reshitka.words;

  function byId(id) { return document.getElementById(id); }
  var input = { n: byId("array-n"), delay: byId("array-delay"), from: byId("array-from") };
  var value = { n: byId("array-n-out"), delay: byId("array-delay-out"), from: byId("array-from-out") };
  var picture = { wave: byId("array-wave"), received: byId("array-received"), delayed: byId("array-delayed"),
                  plot: byId("array-plot") };
  var told = byId("array-told"), beamTold = byId("array-out");

  var SPAN = 3;          // periods of the wave that the pictures of the signals show, as panel (г) of the figure
  var GUTTER = 58;       // points at the left of a picture of signals: the number of a row and its delay
  var SHORTEST = 14;     // a crest of the wave shorter than this, in points, would look like a speck: it is left out
  var SIGNAL = 9;        // points from the middle of a row to a crest of its signal, at most
  var SUM = 72;          // points from the middle of the row of the sum to the largest possible sum, at most

  // What the sliders say. The slider of the transmitter counts degrees to the right of the direction straight
  // ahead; the model counts a direction from the line of the elements, where straight ahead is 90.
  function state() {
    return { n: Number(input.n.value), part: Math.round(Number(input.delay.value) * 100) / 100,
             degrees: 90 - Number(input.from.value) };
  }

  // ---------------------------------------------------------------- 1: the wave comes to the row of elements
  // A view from above. The row lies near the lower edge with its middle in the middle of the picture. The wave
  // is drawn in the part above the row (here «the sky»); a strip over the sky is kept clear for the word of
  // the wave, so that no crest runs through the word.
  function drawWave(s) {
    var svg = picture.wave, wide = D.width(svg);
    var pitch = Math.max(10, Math.min(26, (wide - 48) / (A.MAX_ELEMENTS - 1)));    // between neighbouring elements
    var wave = pitch / A.SPACING;                                                  // one wavelength, in points
    var skyTop = 22, rowY = skyTop + 2.6 * wave + 9, high = rowY + 32, middle = wide / 2;
    var a = s.degrees * Math.PI / 180, ux = Math.cos(a), uy = -Math.sin(a);        // towards the transmitter
    var places = A.places(s.n, A.SPACING), reach = A.arrival(s.n, A.SPACING, s.degrees);
    var first = A.front(s.n, A.SPACING, s.degrees);
    var seen = middle * Math.abs(ux) + (rowY - skyTop) * -uy;      // the furthest point of the sky along the way of the wave
    var above = 8 / -uy;                                           // a way begins at the edge of the box of the row
    var most = (rowY - skyTop) / -uy;                              // and ends at the top of the sky at the latest
    var k, m, d, x, length, ends, r, tail, word;
    D.sheet(svg, wide, high);
    D.shape(svg, "rect", { x: middle + places[0] * wave - 12, y: rowY - 8,
                           width: (places[s.n - 1] - places[0]) * wave + 24, height: 16, "class": "plate" });
    // dotted: the way that the first crest still has to go to each element
    for (k = 0; k < s.n; k += 1) {
      x = middle + places[k] * wave;
      length = Math.min(reach[k] * wave, most);
      if (length > above + 2) {
        D.shape(svg, "line", { x1: x + above * ux, y1: rowY + above * uy, x2: x + length * ux, y2: rowY + length * uy,
                               "class": "way" });
      }
    }
    // the crests of the wave: lines across its way, one wavelength apart; the first has just reached the row
    for (m = 0; (first + m) * wave <= seen; m += 1) {
      d = (first + m) * wave;
      ends = D.within(middle + d * ux, rowY + d * uy, -uy, ux, 0, skyTop, wide, rowY + 1);
      if (ends && Math.sqrt(Math.pow(ends[1][0] - ends[0][0], 2) + Math.pow(ends[1][1] - ends[0][1], 2)) >= SHORTEST) {
        D.shape(svg, "line", { x1: ends[0][0], y1: ends[0][1], x2: ends[1][0], y2: ends[1][1],
                               "class": m ? "front" : "front first" });
      }
    }
    // the elements and their numbers: every number when there is room, otherwise the first, the last and every fourth
    for (k = 0; k < s.n; k += 1) {
      x = middle + places[k] * wave;
      D.shape(svg, "circle", { cx: x, cy: rowY, r: 3, "class": "element" });
      if (pitch >= 20 || k === 0 || k === s.n - 1 || ((k + 1) % 4 === 0 && k < s.n - 2)) {
        D.shape(svg, "text", { x: x, y: rowY + 25, "class": "num" }, String(k + 1));
      }
    }
    // the arrow of the way of the wave points at the middle of the row from the side of the transmitter; its
    // word stands over its tail, in the clear strip
    r = (rowY - skyTop - 6) / -uy;
    if (Math.abs(ux) > 1e-6) { r = Math.min(r, (middle - 16) / Math.abs(ux)); }
    tail = [middle + r * ux, rowY + r * uy];
    D.arrow(svg, tail[0], tail[1], tail[0] - 30 * ux, tail[1] - 30 * uy, "travel", 9);
    word = D.shape(svg, "text", { x: Math.max(26, Math.min(wide - 26, tail[0])), y: skyTop - 7 }, WORDS.wave);
    word.setAttribute("text-anchor", "middle");
  }

  // ---------------------------------------------------------------- 2 and 3: the signals of the elements and their sum
  // A row for each element, the time from the left to the right. `lags`: when each signal comes, in periods.
  // `holds`: how long the array holds each signal; without it the picture shows the signals as they are received.
  function drawSignals(svg, s, lags, holds) {
    var wide = D.width(svg), n = s.n;
    var amp = Math.min(SIGNAL, SUM / n), row = Math.max(16, 2.6 * amp), top = 20;
    var left = GUTTER, right = wide - 6, period = (right - left) / SPAN;
    var ySum = top + n * row + 10 + n * amp, yScale = ySum + n * amp + 14, high = yScale + 10;
    var steps = Math.max(60, Math.ceil((right - left) / 2)), latest = 0, k, i, t, y, from, points, total;
    function x(moment) { return left + moment * period; }
    function rowY(index) { return top + row * (index + 0.5); }
    D.sheet(svg, wide, high);

    // lines through the crests of the signals, from above the first row to under the last one: slanted when
    // the signals come at different moments
    A.crests(lags, SPAN).forEach(function (pair) {
      var x1 = x(pair[0]), y1 = rowY(0) - amp, x2 = x(pair[1]), y2 = rowY(n - 1) - amp;
      var ends = D.within(x1, y1, x2 - x1, y2 - y1, left, top - 2, right, top + n * row + 2);
      if (ends) {
        D.shape(svg, "line", { x1: ends[0][0], y1: ends[0][1], x2: ends[1][0], y2: ends[1][1], "class": "crest" });
      }
    });

    for (k = 0; k < n; k += 1) {
      y = rowY(k);
      from = holds ? A.shown(holds[k]) : 0;          // the signal that the array holds begins later in the picture
      latest = Math.max(latest, from);
      if (from > 0) { D.shape(svg, "line", { x1: x(0), y1: y, x2: x(from), y2: y, "class": "lead" }); }
      points = [];
      for (i = 0; i <= steps; i += 1) {
        t = from + (SPAN - from) * i / steps;
        points.push([x(t), y - amp * A.signal(t, lags[k])]);
      }
      D.shape(svg, "path", { d: D.path(points), "class": "signal" });
      D.shape(svg, "text", { x: 12, y: y + 4.5, "class": "num" }, String(k + 1));
      if (holds) { D.shape(svg, "text", { x: 26, y: y + 4.5, "class": "quiet" }, D.number(holds[k])); }
    }
    if (holds) { D.shape(svg, "text", { x: 26, y: 12, "class": "quiet" }, WORDS.delay); }

    // the sum, at the scale of the rows, between two lines that show the largest possible sum
    D.shape(svg, "line", { x1: left, y1: ySum, x2: right, y2: ySum, "class": "grid" });
    [-1, 1].forEach(function (side) {
      D.shape(svg, "line", { x1: left, y1: ySum + side * n * amp, x2: right, y2: ySum + side * n * amp, "class": "most" });
    });
    points = [];
    for (i = 0; i <= steps; i += 1) {
      t = latest + (SPAN - latest) * i / steps;
      total = 0;
      for (k = 0; k < n; k += 1) { total += A.signal(t, lags[k]); }
      points.push([x(t), ySum - amp * total]);
    }
    D.shape(svg, "path", { d: D.path(points), "class": "sum" });
    D.shape(svg, "text", { x: 4, y: ySum + 4.5 }, WORDS.sum);

    // one period of the wave on the axis of the time
    D.shape(svg, "path", { "class": "scale", d: "M" + x(0) + " " + (yScale - 4) + "V" + (yScale + 4) + "M" + x(0) + " " +
                           yScale + "H" + x(1) + "M" + x(1) + " " + (yScale - 4) + "V" + (yScale + 4) });
    D.shape(svg, "text", { x: x(1) + 6, y: yScale + 4.5, "class": "quiet" }, WORDS.period);
  }

  // ---------------------------------------------------------------- 4: from which directions the array receives
  // A view from above. The row lies on the lower line with its middle in the middle of the picture. The curve is
  // brought to one at its best direction, so the best direction always reaches the half circle.
  function drawPlot(s) {
    var svg = picture.plot, wide = D.width(svg);
    var radius = Math.min(wide / 2 - 12, 230), top = 30, x0 = wide / 2, y0 = top + radius, high = y0 + 26;
    var directions = [], places = A.places(s.n, A.SPACING), values, beam, heard, k, word;
    function at(degrees, r) {
      var a = degrees * Math.PI / 180;
      return [x0 + r * Math.cos(a), y0 - r * Math.sin(a)];
    }
    function ray(degrees, name) {
      var end = at(degrees, radius);
      D.shape(svg, "line", { x1: x0, y1: y0, x2: end[0], y2: end[1], "class": name });
    }
    D.sheet(svg, wide, high);
    D.shape(svg, "line", { x1: x0 - radius, y1: y0, x2: x0 + radius, y2: y0, "class": "grid" });
    D.shape(svg, "path", { d: "M" + (x0 - radius) + " " + y0 + " A" + radius + " " + radius + " 0 0 1 " + (x0 + radius) +
                           " " + y0, "class": "grid" });
    ray(90, "grid");

    for (k = 0; k <= 360; k += 1) { directions.push(k * 0.5); }
    values = A.pattern(s.n, A.SPACING, A.shift(s.part), directions);
    D.shape(svg, "polygon", { "class": "curve", points: directions.map(function (d, i) {
      var p = at(d, radius * values[i]);
      return p[0].toFixed(1) + "," + p[1].toFixed(1);
    }).join(" ") });

    // the edges of the beam: the directions from which the array receives half the power of the best one
    beam = A.beam(s.n, A.SPACING, A.shift(s.part));
    ray(beam.from, "edge");
    ray(beam.to, "edge");

    // the direction to the transmitter, and on it a dot: how well the array hears the transmitter
    ray(s.degrees, "ray");
    heard = at(s.degrees, radius * A.heard(s.n, A.SPACING, A.shift(s.part), s.degrees));
    D.shape(svg, "circle", { cx: heard[0], cy: heard[1], r: 4.5, "class": "heard" });

    for (k = 0; k < s.n; k += 1) {
      D.shape(svg, "circle", { cx: x0 + places[k] * 16, cy: y0, r: 2.6, "class": "element" });
    }
    word = D.shape(svg, "text", { x: x0, y: y0 - radius - 12, "class": "quiet" }, WORDS.ahead);
    word.setAttribute("text-anchor", "middle");
    D.shape(svg, "text", { x: x0 - radius, y: y0 + 18, "class": "quiet" }, WORDS.left);
    word = D.shape(svg, "text", { x: x0 + radius, y: y0 + 18, "class": "quiet" }, WORDS.right);
    word.setAttribute("text-anchor", "end");
  }

  function draw() {
    var s = state();
    var fits = s.n >= A.MIN_ELEMENTS && s.n <= A.MAX_ELEMENTS && Math.abs(s.part) <= A.MAX_SHIFT + 1e-9 &&
               Math.abs(90 - s.degrees) <= A.MAX_TURN + 1e-9;
    var plain, held;
    value.n.textContent = String(s.n);
    value.delay.textContent = A.held(s.part);
    value.from.textContent = A.side(s.degrees);
    told.textContent = A.told(s.n, s.part, s.degrees);
    beamTold.textContent = A.readout(s.n, s.part);
    if (!fits) { return; }
    plain = A.added(s.n, A.SPACING, 0, s.degrees);
    held = A.added(s.n, A.SPACING, s.part, s.degrees);
    drawWave(s);
    drawSignals(picture.received, s, plain.lags, null);
    drawSignals(picture.delayed, s, held.lags, held.delays);
    drawPlot(s);
  }

  Object.keys(input).forEach(function (name) { input[name].addEventListener("input", draw); });
  window.addEventListener("resize", draw);
  draw();
})();
