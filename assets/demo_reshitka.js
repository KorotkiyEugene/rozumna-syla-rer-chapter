/* The live picture of an antenna array on the page of topic 3: panels (в) and (г) of figure 3.5 of the chapter,
   moved by two sliders. The transmitter stands where it stands in the figure. Every number of the array comes
   from array.js (window.RerArray): this file holds no formula of the array, it only draws. The words inside
   the pictures and the direction to the transmitter come with the page (window.RER_T3.demo.reshitka).
   A picture is drawn point for point (draw.js), so both are drawn again when the width of the window changes. */
(function () {
  "use strict";
  var A = window.RerArray, D = window.RerDraw, PAGE = window.RER_T3.demo.reshitka, WORDS = PAGE.words;
  var FROM = PAGE.from;  // the direction to the transmitter, in degrees from the line of the elements

  function byId(id) { return document.getElementById(id); }
  var input = { n: byId("array-n"), delay: byId("array-delay") };
  var value = { n: byId("array-n-out"), delay: byId("array-delay-out") };
  var picture = { signals: byId("array-signals"), plot: byId("array-plot") };
  var told = byId("array-out");

  var SPAN = 3;          // periods of the wave that the picture of the signals shows, as panel (г) of the figure
  var GUTTER = 100;      // points at the left of the picture of the signals: the number of a row and its delay
  var NUMBER = 14;       // the middle of the column of the numbers of the elements, points from the left
  var DELAY = 62;        // the middle of the column of the delays
  var HEAD = 22;         // points above the first row: the heads of the two columns
  var ROWS = 264;        // points of height that the rows take when they are many: 16 rows of words, each 16 points
                         // high, fit in it without touching
  var PITCH = 56;        // points between two rows, at most: a few rows do not leave most of the picture empty
  var CREST = 0.36;      // from the middle of a row to a crest of its signal: this part of the distance between rows,
  var HIGHEST = 16;      // and this many points at most
  var GAP = 22;          // points between the last row and the strip of the sum: room for the words of the strip
  var SUM = 28;          // points from the middle of the row of the sum to the largest possible sum

  function state() {
    return { n: Number(input.n.value), part: Math.round(Number(input.delay.value) * 100) / 100 };
  }

  // ---------------------------------------------------------------- the signals of the elements and their sum
  // A row for each element, the time from the left to the right. `sum` is what array.js says of the signals at
  // the adder: `lags` (when each of them comes, in periods) and `delays` (how long the array holds each of them).
  // The picture has one height for every count of elements, so the page under it stays where it is.
  function drawSignals(s, sum) {
    var svg = picture.signals, wide = D.width(svg), n = s.n;
    var pitch = Math.min(PITCH, ROWS / n), amp = Math.min(CREST * pitch, HIGHEST);
    var left = GUTTER, right = wide - 6, period = (right - left) / SPAN;
    var ySum = HEAD + n * pitch + GAP + SUM, high = HEAD + ROWS + GAP + 2 * SUM + 4;
    var steps = Math.max(120, Math.ceil(right - left)), k, i, t, y, points, total, word;
    function x(moment) { return left + moment * period; }
    function rowY(index) { return HEAD + pitch * (index + 0.5); }
    D.sheet(svg, wide, high);

    // lines through the crests of the signals, from the first row to the last: slanted when the signals come
    // at different moments, upright when they come together. Half a point of room at the sides keeps a line
    // that stands exactly at an edge of the rows.
    A.crests(sum.lags, SPAN).forEach(function (pair) {
      var x1 = x(pair[0]), y1 = rowY(0) - amp, x2 = x(pair[1]), y2 = rowY(n - 1) - amp;
      var ends = D.within(x1, y1, x2 - x1, y2 - y1, left - 0.5, y1, right + 0.5, y2);
      if (ends) {
        D.shape(svg, "line", { x1: ends[0][0], y1: ends[0][1], x2: ends[1][0], y2: ends[1][1], "class": "crest" });
      }
    });

    D.shape(svg, "text", { x: NUMBER, y: 14, "class": "quiet num" }, WORDS.number);
    D.shape(svg, "text", { x: DELAY, y: 14, "class": "quiet num" }, WORDS.delay);
    for (k = 0; k < n; k += 1) {
      y = rowY(k);
      points = [];
      for (i = 0; i <= steps; i += 1) {
        t = SPAN * i / steps;
        points.push([x(t), y - amp * A.signal(t, sum.lags[k])]);
      }
      D.shape(svg, "path", { d: D.path(points), "class": "signal" });
      D.shape(svg, "text", { x: NUMBER, y: y + 4.5, "class": "num" }, String(k + 1));
      D.shape(svg, "text", { x: DELAY, y: y + 4.5, "class": "quiet num" }, D.number(sum.delays[k]));
    }

    // the sum, in a strip as high as the largest possible sum: the sum of signals that all come together. The
    // strip is one thing with one label; its two edges are plain lines, so only the lines through the crests
    // are dashed in this picture.
    D.shape(svg, "rect", { x: left, y: ySum - SUM, width: right - left, height: 2 * SUM, "class": "band" });
    D.shape(svg, "line", { x1: left, y1: ySum, x2: right, y2: ySum, "class": "grid" });
    [-1, 1].forEach(function (side) {
      D.shape(svg, "line", { x1: left, y1: ySum + side * SUM, x2: right, y2: ySum + side * SUM, "class": "most" });
    });
    points = [];
    for (i = 0; i <= steps; i += 1) {
      t = SPAN * i / steps;
      total = 0;
      for (k = 0; k < n; k += 1) { total += A.signal(t, sum.lags[k]); }
      points.push([x(t), ySum - SUM * total / n]);
    }
    D.shape(svg, "path", { d: D.path(points), "class": "sum" });
    D.shape(svg, "text", { x: (NUMBER + DELAY) / 2, y: ySum + 4.5, "class": "num" }, WORDS.sum);
    word = D.shape(svg, "text", { x: right, y: ySum - SUM - 6, "class": "quiet" }, WORDS.most);
    word.setAttribute("text-anchor", "end");
  }

  // ---------------------------------------------------------------- from which directions the array receives
  // A view from above. The row lies on the lower line with its middle in the middle of the picture. The curve is
  // brought to one at its best direction, so the best direction always reaches the half circle. The transmitter
  // is far away: its dot stands on the half circle, where a beam that is turned to the transmitter ends.
  function drawPlot(s) {
    var svg = picture.plot, wide = D.width(svg);
    var radius = Math.min(wide / 2 - 12, 230), top = 30, x0 = wide / 2, y0 = top + radius, high = y0 + 26;
    var directions = [], places = A.places(s.n, A.SPACING), toRight = FROM < 90, values, beam, source, k, word, length;
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

    // the direction to the transmitter and the transmitter itself; its word stands beside it, outside the half
    // circle, and moves towards the middle when the picture is too narrow for it
    ray(FROM, "ray");
    source = at(FROM, radius);
    D.shape(svg, "circle", { cx: source[0], cy: source[1], r: 5, "class": "source" });
    word = D.shape(svg, "text", { x: source[0], y: source[1] - 10 }, WORDS.source);
    length = word.getComputedTextLength();
    word.setAttribute("x", toRight ? Math.min(source[0] + 9, wide - 2 - length) : Math.max(source[0] - 9 - length, 2));

    // the elements, and the numbers of the two at the ends of the row: the rows of the signals have the same numbers
    for (k = 0; k < s.n; k += 1) {
      D.shape(svg, "circle", { cx: x0 + places[k] * 16, cy: y0, r: 2.6, "class": "element" });
    }
    word = D.shape(svg, "text", { x: x0 + places[0] * 16 - 5, y: y0 + 18 }, "1");
    word.setAttribute("text-anchor", "end");
    D.shape(svg, "text", { x: x0 + places[s.n - 1] * 16 + 5, y: y0 + 18 }, String(s.n));

    word = D.shape(svg, "text", { x: x0, y: y0 - radius - 12, "class": "quiet" }, WORDS.ahead);
    word.setAttribute("text-anchor", "middle");
    D.shape(svg, "text", { x: x0 - radius, y: y0 + 18, "class": "quiet" }, WORDS.left);
    word = D.shape(svg, "text", { x: x0 + radius, y: y0 + 18, "class": "quiet" }, WORDS.right);
    word.setAttribute("text-anchor", "end");
  }

  function draw() {
    var s = state();
    value.n.textContent = String(s.n);
    value.delay.textContent = A.held(s.part);
    D.say(told, (A.readout(s.n, s.part) + " " + A.summed(s.n, s.part, FROM)).trim());
    if (!(s.n >= A.MIN_ELEMENTS && s.n <= A.MAX_ELEMENTS && Math.abs(s.part) <= A.MAX_SHIFT + 1e-9)) { return; }
    drawSignals(s, A.added(s.n, A.SPACING, s.part, FROM));
    drawPlot(s);
  }

  Object.keys(input).forEach(function (name) { input[name].addEventListener("input", draw); });
  window.addEventListener("resize", draw);
  draw();
})();
