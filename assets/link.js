/* The picture of the calculator of topic 2: a transmitter in the centre of an imaginary sphere, the patch of the
   sphere from which the antenna of a telephone collects power, and the same patch drawn on squared paper beside
   one wavelength. The words and the sizes come from RerRadio.link(): this file only places and draws them. */
(function (root) {
  "use strict";
  var COLS = 15, ROWS = 8;         // squares of the paper: a wavelength takes at most 14 of them, a patch at most 4
  var SQUARE = 13;                 // points of the screen in one square of the paper
  var WIDE = 640;                  // from this width the paper stands to the right of the sphere, else above it
  var RADIUS = 140;                // points: the sphere on a wide screen
  var LINE = 18;                   // points between two lines of words

  // Where everything stands in a picture of the given width (points of the screen). On a narrow screen the paper
  // stands above the sphere at the right edge and its patch is drawn at its right side: the lines from the mark
  // on the sphere to the patch then go up past the telephone and cross nothing.
  function layout(width) {
    var wide = width >= WIDE;
    var r = wide ? RADIUS : Math.max(70, Math.min(RADIUS, Math.floor((width - 108) / 2)));
    var paper = { x: wide ? 10 + 2 * r + 70 : width - 2 - COLS * SQUARE, y: 44, square: SQUARE, cols: COLS,
                  rows: ROWS, mirror: !wide };
    var bottom = paper.y + ROWS * SQUARE;
    var cx = (wide ? 10 : 8) + r, cy = wide ? bottom + 44 : bottom + 16 + r;
    return { wide: wide, width: width, height: cy + r + 10, sphere: { cx: cx, cy: cy, r: r }, paper: paper,
             mark: { x: cx + r - 7, y: cy - 7, side: 14 },
             phone: { x: cx + r + (wide ? 34 : 26), y: cy - 8, width: 30, height: 56 } };
  }

  // Draw the picture into `svg` for what RerRadio.link() gave.
  function draw(svg, shown) {
    var D = root.RerDraw, g = layout(D.width(svg)), s = g.sphere, p = g.paper, q = p.square, k;
    D.sheet(svg, g.width, g.height);

    // the sphere with its equator, the transmitter in its centre and the line to the mark
    var ry = 0.22 * s.r, left = (s.cx - s.r) + " " + s.cy, arc = " A" + s.r + " " + ry + " 0 0 ";
    D.shape(svg, "circle", { cx: s.cx, cy: s.cy, r: s.r, "class": "ball" });
    D.shape(svg, "path", { d: "M" + left + arc + "1 " + (s.cx + s.r) + " " + s.cy, "class": "equator back" });
    D.shape(svg, "path", { d: "M" + left + arc + "0 " + (s.cx + s.r) + " " + s.cy, "class": "equator" });
    D.shape(svg, "line", { x1: s.cx + 22, y1: s.cy, x2: g.mark.x, y2: s.cy, "class": "radius" });
    [-1, 1].forEach(function (side) {
      D.shape(svg, "line", { x1: s.cx + side * 14, y1: s.cy - 6, x2: s.cx + side * 18, y2: s.cy - 26, "class": "router-line" });
    });
    D.shape(svg, "rect", { x: s.cx - 22, y: s.cy - 6, width: 44, height: 16, rx: 3, "class": "router" });
    [-8, 0, 8].forEach(function (dx) {
      D.shape(svg, "circle", { cx: s.cx + dx, cy: s.cy + 2, r: 1.6, "class": "router-dot" });
    });

    // the paper in squares, one wavelength on it and the patch to the same scale
    D.shape(svg, "rect", { x: p.x, y: p.y, width: COLS * q, height: ROWS * q, "class": "paper" });
    for (k = 1; k < COLS; k += 1) {
      D.shape(svg, "line", { x1: p.x + k * q, y1: p.y, x2: p.x + k * q, y2: p.y + ROWS * q, "class": "paper-line" });
    }
    for (k = 1; k < ROWS; k += 1) {
      D.shape(svg, "line", { x1: p.x, y1: p.y + k * q, x2: p.x + COLS * q, y2: p.y + k * q, "class": "paper-line" });
    }
    var points = [], steps = 48;
    for (k = 0; k <= steps; k += 1) {
      points.push([p.x + 0.5 * q + shown.paper.wave * q * k / steps,
                   p.y + 1.1 * q - 0.7 * q * Math.sin(2 * Math.PI * k / steps)]);
    }
    D.shape(svg, "path", { d: D.path(points), "class": "wave" });
    var side = shown.paper.side * q;
    var px = p.mirror ? p.x + (COLS - 0.5) * q - side : p.x + 0.5 * q, py = p.y + (ROWS - 0.5) * q - side;

    // the mark on the sphere is the patch: two lines join them
    D.shape(svg, "line", { x1: g.mark.x, y1: g.mark.y, x2: px, y2: py + side, "class": "zoom" });
    D.shape(svg, "line", { x1: g.mark.x + g.mark.side, y1: g.mark.y, x2: px + side, y2: py + side, "class": "zoom" });
    D.shape(svg, "rect", { x: px, y: py, width: side, height: side, "class": "patch big" });
    D.shape(svg, "rect", { x: g.mark.x, y: g.mark.y, width: g.mark.side, height: g.mark.side, "class": "patch small" });

    // the telephone beside the mark
    var t = g.phone;
    D.shape(svg, "rect", { x: t.x, y: t.y, width: t.width, height: t.height, rx: 5, "class": "phone" });
    D.shape(svg, "rect", { x: t.x + 3, y: t.y + 6, width: t.width - 6, height: t.height - 16, "class": "screen" });
    D.shape(svg, "circle", { cx: t.x + t.width / 2, cy: t.y + t.height - 5, r: 2, "class": "phone-dot" });

    // the words: inside the sphere, under the telephone, above the paper and on it
    D.shape(svg, "text", { x: s.cx, y: s.cy - 0.5 * s.r, "class": "num inside" }, "уявна сфера");
    D.shape(svg, "text", { x: s.cx, y: s.cy - 0.5 * s.r + LINE, "class": "num strong inside" }, "площа " + shown.sphere);
    D.shape(svg, "text", { x: (s.cx + 22 + g.mark.x) / 2, y: s.cy - 6, "class": "num inside" }, shown.radius);
    D.shape(svg, "text", { x: s.cx, y: s.cy + ry + LINE, "class": "num inside" }, "передавач випромінює");
    D.shape(svg, "text", { x: s.cx, y: s.cy + ry + 2 * LINE, "class": "num strong inside" }, shown.emitted);
    D.shape(svg, "text", { x: t.x + t.width / 2, y: t.y + t.height + LINE, "class": "num" }, "антена приймає");
    D.shape(svg, "text", { x: t.x + t.width / 2, y: t.y + t.height + 2 * LINE, "class": "num strong" }, shown.received);
    var edge = p.mirror ? { x: g.width - 2, "class": "end" } : { x: p.x, "class": "" };
    D.shape(svg, "text", { x: edge.x, y: 16, "class": edge["class"] }, "клаптик, з якого антена збирає потужність");
    D.shape(svg, "text", { x: edge.x, y: 16 + LINE, "class": ("quiet " + edge["class"]).trim() },
            "сторона клітинки " + shown.square);
    var words = p.mirror ? { x: p.x + 6, "class": "" } : { x: p.x + COLS * q - 6, "class": "end" };
    D.shape(svg, "text", { x: words.x, y: p.y + 3.0 * q, "class": words["class"] }, "хвиля " + shown.wave);
    D.shape(svg, "text", { x: words.x, y: p.y + 4.6 * q, "class": ("strong " + words["class"]).trim() }, shown.patch);
    D.shape(svg, "text", { x: words.x, y: p.y + 6.1 * q, "class": words["class"] }, "бік " + shown.side);
  }

  var api = { layout: layout, draw: draw };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    root.RerLink = api;
  }
})(typeof self !== "undefined" ? self : this);
