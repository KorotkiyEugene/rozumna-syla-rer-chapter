/* The live picture «Пеленги й різниця часу на карті» of the page of topic 6: the map of the training area,
   its three posts and a transmitter that the reader moves. Two buttons choose what the posts measure: bearings
   or, pair by pair, the difference of the times of arrival. A slider sets the error of the measurement. A grey
   field shows each sector or band of the error, a red field the place that lies in all three. Every number
   comes from locate.js (window.RerLocate): this file only draws. The scene, the colours and the words come with
   the page (window.RER_T6.place). The picture is built again when the width of the window changes. */
(function () {
  "use strict";
  var L = window.RerLocate, F = window.RerFix, D = window.RerDraw, P = window.RER_T6 && window.RER_T6.place;
  var svg = document.getElementById("loc-plot");
  var slider = document.getElementById("loc-error");
  var out = document.getElementById("loc-out");
  var errorName = document.getElementById("loc-error-name");
  var errorOut = document.getElementById("loc-error-out");
  if (!svg || !slider || !out || !P) { return; }
  var MODES = Object.keys(P.sliders), buttons = {};
  MODES.forEach(function (mode) { buttons[mode] = document.getElementById("loc-" + mode); });

  var LEFT = 30, RIGHT = 40, TOP = 28, BOTTOM = 24;   // pixels around the map for the numbers of its sides
  var FAR = 200000;                                   // metres: a bearing is drawn this far, beyond the map
  var CURVE_POINTS = 161, CURVE_REACH = 90000;        // a hyperbola: so many points, the ends so far away, metres
  var MOST_CELLS = 300000;                            // the picture of the fields has no more points than this
  var RING = 8;                                       // pixels: the radius of the ring of the transmitter
  var RAD = Math.PI / 180;
  var box = { x: [0, P.map.width], y: [0, P.map.height] };
  var state = { mode: MODES[0], spot: P.start.slice(), steps: {}, moved: false };
  MODES.forEach(function (mode) { state.steps[mode] = P.sliders[mode].start; });
  var raster = document.createElement("canvas");
  var view = null, waiting = false, dragging = false;

  function rgb(hex) {
    return [1, 3, 5].map(function (k) { return parseInt(hex.slice(k, k + 2), 16); });
  }
  var PALE = rgb(P.colours.pale), STRONG = rgb(P.colours.strong);

  // The parts of the picture that stay while the transmitter moves: the map, its posts and the mark of the
  // transmitter, whose place alone changes.
  function build() {
    var wide = Math.min(D.width(svg), 720), unit = (wide - LEFT - RIGHT) / P.map.width;
    var mapW = P.map.width * unit, mapH = P.map.height * unit, high = Math.round(TOP + mapH + BOTTOM), k;
    function x(m) { return LEFT + m * unit; }
    function y(m) { return TOP + (P.map.height - m) * unit; }
    function at(p) { return [x(p[0]), y(p[1])]; }

    D.sheet(svg, wide, high);
    D.shape(svg, "rect", { x: x(0), y: TOP, width: mapW, height: mapH, fill: "#ffffff" });
    // our side of the conditional line, as on the maps of the chapter
    D.shape(svg, "polygon", { fill: P.colours.side, points: [[0, P.map.height]].concat(P.line, [[0, 0]]).map(function (p) {
      var q = at(p);
      return q[0].toFixed(1) + "," + q[1].toFixed(1);
    }).join(" ") });
    // the grey fields lie under the grid and the lines, the red field over the lines: a small red area is seen
    var fields = D.shape(svg, "image", { x: x(0), y: TOP, width: mapW, height: mapH, preserveAspectRatio: "none" });
    for (k = P.map.grid; k < P.map.width; k += P.map.grid) {
      D.shape(svg, "line", { x1: x(k), y1: TOP, x2: x(k), y2: TOP + mapH, "class": "grid" });
    }
    for (k = P.map.grid; k < P.map.height; k += P.map.grid) {
      D.shape(svg, "line", { x1: x(0), y1: y(k), x2: x(P.map.width), y2: y(k), "class": "grid" });
    }
    D.shape(svg, "rect", { x: x(0), y: TOP, width: mapW, height: mapH, fill: "none", stroke: P.colours.ink, "stroke-width": 1.5 });
    for (k = 0; k <= P.map.width; k += P.map.tick) {
      D.shape(svg, "text", { x: x(k), y: TOP + mapH + 16, "class": "num quiet" }, String(k / 1000));
    }
    for (k = 0; k <= P.map.height; k += P.map.tick) {
      D.shape(svg, "text", { x: x(0) - 6, y: y(k) + 4, "class": "end quiet" }, String(k / 1000));
    }
    D.shape(svg, "text", { x: x(P.map.width) + 14, y: TOP + mapH + 16, "class": "quiet" }, P.words.km);
    D.shape(svg, "text", { x: x(0) - 6, y: TOP - 12, "class": "end quiet" }, P.words.km);
    D.shape(svg, "path", { d: D.path(P.line.map(at)), fill: "none", stroke: P.colours.ink, "stroke-width": 2,
                           "stroke-dasharray": "7 5" });
    var lines = D.shape(svg, "g", {});
    var patch = D.shape(svg, "image", { x: x(0), y: TOP, width: mapW, height: mapH, preserveAspectRatio: "none" });
    P.posts.forEach(function (post) {
      var p = at(post.at);
      D.shape(svg, "rect", { x: p[0] - 6, y: p[1] - 6, width: 12, height: 12, fill: P.colours.post, stroke: "#ffffff",
                             "stroke-width": 1.5 });
      D.shape(svg, "text", { x: p[0] + post.label[0], y: p[1] + post.label[1], "text-anchor": post.label[2],
                             "class": "strong" }, post.id);
    });
    // The transmitter is an empty ring with a white edge around its place: a filled mark or a cross would hide
    // a small red area. Its name stands beside it, and around it lies an unseen disc to take hold of.
    var mark = D.shape(svg, "g", {});
    [["#ffffff", 3.6], [P.colours.ink, 1.6]].forEach(function (pen) {
      D.shape(mark, "circle", { r: RING, fill: "none", stroke: pen[0], "stroke-width": pen[1] });
    });
    var name = D.shape(mark, "text", { y: -RING - 5, "class": "strong", style: "fill:" + P.colours.name });
    var grip = D.shape(mark, "circle", { r: 22, fill: "none", "pointer-events": "all", "class": "grip", tabindex: 0,
                                         "aria-label": P.words.grip });
    grip.addEventListener("pointerdown", function (ev) {
      dragging = true;
      grip.setPointerCapture(ev.pointerId);
      ev.preventDefault();
    });
    grip.addEventListener("pointermove", function (ev) { if (dragging) { put(ev); } });
    ["pointerup", "pointercancel"].forEach(function (kind) {
      grip.addEventListener(kind, function () { dragging = false; });
    });
    grip.addEventListener("keydown", function (ev) {
      var step = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }[ev.key];
      if (!step) { return; }
      ev.preventDefault();
      move([state.spot[0] + step[0] * P.key_step, state.spot[1] + step[1] * P.key_step]);
    });

    // The picture of the fields has about one point for each point of the screen, and no more than MOST_CELLS.
    var fine = Math.min(window.devicePixelRatio || 1, 2), nx = Math.round(mapW * fine), ny = Math.round(mapH * fine);
    var less = Math.min(Math.sqrt(MOST_CELLS / (nx * ny)), 1);
    view = { wide: wide, high: high, unit: unit, at: at, fields: fields, patch: patch, lines: lines, mark: mark,
             name: name,
             nx: Math.round(nx * less), ny: Math.round(ny * less) };
  }

  // A field as a picture: the points that lie in at least `least` sectors or bands, in one colour.
  function paint(cells, nx, ny, least, c) {
    raster.width = nx;
    raster.height = ny;
    var ctx = raster.getContext("2d"), img = ctx.createImageData(nx, ny), k, q;
    for (k = 0; k < cells.length; k += 1) {
      if (cells[k] < least) { continue; }
      q = 4 * k;
      img.data[q] = c[0];
      img.data[q + 1] = c[1];
      img.data[q + 2] = c[2];
      img.data[q + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    return raster.toDataURL();
  }

  // A stroke through points of the map, drawn only as far as the map reaches.
  function stroke(points, colour) {
    var d = "", k, seen, p, q;
    for (k = 0; k + 1 < points.length; k += 1) {
      seen = F.cutSegment(points[k], points[k + 1], box);
      if (!seen) { continue; }
      p = view.at(seen[0]);
      q = view.at(seen[1]);
      d += "M" + p[0].toFixed(1) + " " + p[1].toFixed(1) + "L" + q[0].toFixed(1) + " " + q[1].toFixed(1);
    }
    D.shape(view.lines, "path", { d: d, fill: "none", stroke: colour, "stroke-width": 2, "stroke-linecap": "round",
                                  "stroke-linejoin": "round" });
  }

  function update() {
    var v = view, mode = state.mode, k = state.steps[mode], err = L.error(P, mode, k), spot = state.spot;
    // grey where a point lies in a sector or band, red where it lies in all of them
    var cells = L.field(P, mode, spot, err, v.nx, v.ny);
    v.fields.setAttribute("href", paint(cells, v.nx, v.ny, 1, PALE));
    v.patch.setAttribute("href", paint(cells, v.nx, v.ny, L.all(P, mode), STRONG));

    v.lines.textContent = "";
    if (mode === "bearings") {
      P.posts.forEach(function (post) {
        var az = L.bearing(post.at, spot) * RAD;
        stroke([post.at, [post.at[0] + FAR * Math.sin(az), post.at[1] + FAR * Math.cos(az)]], P.colours.bearing);
      });
    } else {
      P.pairs.forEach(function (pair, n) {
        var a = P.posts[pair[0]].at, b = P.posts[pair[1]].at;
        stroke(L.curve(a, b, L.delay(a, b, spot, P.c), P.c, CURVE_POINTS, CURVE_REACH), P.colours.pairs[n]);
      });
    }

    // The name of the transmitter stands to the right of it, and to the left near the right edge of the map.
    var p = v.at(spot), atRight = spot[0] > P.map.width * 0.72;
    v.mark.setAttribute("transform", "translate(" + p[0].toFixed(1) + " " + p[1].toFixed(1) + ")");
    v.name.setAttribute("x", atRight ? -RING - 5 : RING + 5);
    v.name.setAttribute("text-anchor", atRight ? "end" : "start");
    v.name.textContent = state.moved ? P.words.transmitter : P.words.drag;

    // The lines under the map: a mark of the colour of each line, the measured numbers, the area in red.
    var rows = L.rows(P, mode, spot, L.area(P, mode, spot, err));
    out.textContent = "";
    rows.forEach(function (row, n) {
      var last = n === rows.length - 1;
      var line = document.createElement("span"), key = document.createElement("span"), told = document.createElement("span");
      line.className = last ? "row strong" : "row";
      key.className = last ? "key patch" : "key";
      key.style.background = last ? P.colours.strong : (mode === "bearings" ? P.colours.bearing : P.colours.pairs[n]);
      D.say(told, row);
      line.appendChild(key);
      line.appendChild(told);
      out.appendChild(line);
    });
    if (errorName) { errorName.textContent = P.words.errors[mode]; }
    if (errorOut) { errorOut.textContent = L.errorText(P, mode, k); }
  }

  // One drawing for each picture of the screen, however often the pointer reports a move.
  function schedule() {
    if (waiting) { return; }
    waiting = true;
    window.requestAnimationFrame(function () {
      waiting = false;
      update();
    });
  }

  function move(point) {
    state.spot = L.snap(P, point);
    state.moved = true;
    schedule();
  }

  // Put the transmitter where the pointer is.
  function put(ev) {
    var r = svg.getBoundingClientRect();
    var px = (ev.clientX - r.left) * view.wide / r.width, py = (ev.clientY - r.top) * view.high / r.height;
    move([(px - LEFT) / view.unit, P.map.height - (py - TOP) / view.unit]);
  }

  function choose(mode) {
    state.mode = mode;
    MODES.forEach(function (name) {
      if (!buttons[name]) { return; }
      buttons[name].setAttribute("aria-pressed", name === mode ? "true" : "false");
      buttons[name].className = name === mode ? "" : "quiet";
    });
    slider.max = P.sliders[mode].count;
    slider.value = state.steps[mode];
    schedule();
  }

  svg.addEventListener("click", put);
  slider.addEventListener("input", function () {
    state.steps[state.mode] = Number(slider.value);
    schedule();
  });
  MODES.forEach(function (mode) {
    if (buttons[mode]) { buttons[mode].addEventListener("click", function () { choose(mode); }); }
  });
  window.addEventListener("resize", function () {
    build();
    update();
  });
  build();
  update();
})();
