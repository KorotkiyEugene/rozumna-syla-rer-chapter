/* Bearings on a map, as topic 6 of the chapter counts them. A bearing is an angle in degrees from north,
   clockwise; a point is [x, y] in kilometres, x to the east and y to the north. One file for the page and for
   the tests: node loads it as a module. The same computations stand in fix_example.py, and a test compares
   the two at every position of the sliders of the page. */
(function (root) {
  "use strict";
  var RAD = Math.PI / 180;

  // The bearing from a post on a point.
  function bearing(post, point) {
    var d = Math.atan2(point[0] - post[0], point[1] - post[1]) / RAD;
    return (d % 360 + 360) % 360;
  }

  // The point where the bearing azA from postA crosses the bearing azB from postB.
  function place(postA, azA, postB, azB) {
    var a = azA * RAD, b = azB * RAD;
    var det = Math.sin(a) * Math.cos(b) - Math.cos(a) * Math.sin(b);
    var dx = postB[0] - postA[0], dy = postB[1] - postA[1];
    var t = (dx * Math.cos(b) - dy * Math.sin(b)) / det;
    return [postA[0] + t * Math.sin(a), postA[1] + t * Math.cos(a)];
  }

  function distance(a, b) {
    return Math.sqrt((a[0] - b[0]) * (a[0] - b[0]) + (a[1] - b[1]) * (a[1] - b[1]));
  }

  // The quadrilateral where the transmitter may be when the bearing of each post on the point is off by no more
  // than the error: its four corners and its longest diagonal.
  function area(postA, postB, point, error) {
    var azA = bearing(postA, point), azB = bearing(postB, point);
    var corners = [[-1, -1], [-1, 1], [1, 1], [1, -1]].map(function (s) {
      return place(postA, azA + s[0] * error, postB, azB + s[1] * error);
    });
    return { corners: corners, size: Math.max(distance(corners[0], corners[2]), distance(corners[1], corners[3])) };
  }

  // The two posts of the live picture: both stand `reach` away from the point. The first stands to the south
  // of it; the second stands so that the two bearings cross at `angle`.
  function first(point, reach) {
    return [point[0], point[1] - reach];
  }

  function second(point, reach, angle) {
    return [point[0] - reach * Math.sin(angle * RAD), point[1] - reach * Math.cos(angle * RAD)];
  }

  // The part of a polygon that lies inside a box {x: [left, right], y: [bottom, top]}: the list of its corners,
  // empty when the polygon misses the box. The polygon is cut at each of the four edges in turn. A picture draws
  // a shape only as far as it is seen, so that nothing of the picture lies beyond its edges.
  function cutPolygon(points, box) {
    var edges = [[0, box.x[0], 1], [0, box.x[1], -1], [1, box.y[0], 1], [1, box.y[1], -1]];
    edges.forEach(function (edge) {
      var axis = edge[0], limit = edge[1], sign = edge[2], out = [];
      function inside(p) { return sign * (p[axis] - limit) >= 0; }
      points.forEach(function (p, i) {
        var q = points[(i + 1) % points.length], t, cut;
        if (inside(p)) { out.push(p); }
        if (inside(p) !== inside(q)) {
          t = (limit - p[axis]) / (q[axis] - p[axis]);
          cut = [p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])];
          cut[axis] = limit;
          out.push(cut);
        }
      });
      points = out;
    });
    return points;
  }

  // The part of the straight stroke from a to b that lies inside a box: its two ends, or null.
  function cutSegment(a, b, box) {
    var from = 0, to = 1, axis, step, low, high;
    for (axis = 0; axis < 2; axis += 1) {
      step = b[axis] - a[axis];
      low = axis ? box.y[0] : box.x[0];
      high = axis ? box.y[1] : box.x[1];
      if (step === 0) {
        if (a[axis] < low || a[axis] > high) { return null; }
      } else {
        from = Math.max(from, Math.min((low - a[axis]) / step, (high - a[axis]) / step));
        to = Math.min(to, Math.max((low - a[axis]) / step, (high - a[axis]) / step));
      }
    }
    if (!(from < to)) { return null; }
    return [[a[0] + from * (b[0] - a[0]), a[1] + from * (b[1] - a[1])],
            [a[0] + to * (b[0] - a[0]), a[1] + to * (b[1] - a[1])]];
  }

  // Where the name of the second post stands, in pixels from the post, and how the text is anchored. The line of
  // the post leaves it at the bearing `angle`: upwards and to the right while the angle is sharp, so the name
  // stands to the left of the post; from 70 degrees on the line runs low enough for the name to stand above.
  function secondLabel(angle) {
    return angle < 70 ? { dx: -9, dy: 4, anchor: "end" } : { dx: 0, dy: -10, anchor: "middle" };
  }

  // Where the name of the transmitter begins, in pixels from the transmitter (y grows downwards). Four rays leave
  // the transmitter: the two bearings and their continuations, at 0, 180, `angle` and `angle` + 180 degrees. The
  // name stands on the right, in the middle of the wider part between two rays, `clear` pixels beyond the mark.
  function transmitterLabel(angle, clear) {
    var way = (angle <= 90 ? (angle + 180) / 2 : angle / 2) * RAD, far = 14 + clear;
    return [far * Math.sin(way), -far * Math.cos(way)];
  }

  // The size of the area as the page prints it: `words` are the words before and after the number.
  function sizeText(size, words) {
    return words[0] + size.toFixed(1).replace(".", ",") + words[1];
  }

  var api = { bearing: bearing, place: place, distance: distance, area: area, first: first, second: second,
              cutPolygon: cutPolygon, cutSegment: cutSegment, secondLabel: secondLabel,
              transmitterLabel: transmitterLabel, sizeText: sizeText };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    root.RerFix = api;
  }
})(typeof self !== "undefined" ? self : this);
