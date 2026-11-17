/* Three posts and one transmitter on the map of the training area, as topic 6 of the chapter counts them.
   The posts measure the bearings on the transmitter or, pair by pair, the difference of the times at which its
   signal arrives. A bearing with an error is a sector, a difference of times with an error is a band; the
   transmitter may be where all three overlap. A point is [x, y] in metres, x to the east and y to the north;
   a time is in seconds, an angle in degrees from the north clockwise. `d` is the scene that comes with the page
   (window.RER_T6.place). One file for the page and for the tests: node loads it as a module. The same
   computations stand in locate_example.py, and a test compares the two. */
(function (root) {
  "use strict";
  var RAD = Math.PI / 180;

  function far(a, b) {
    var dx = b[0] - a[0], dy = b[1] - a[1];
    return Math.sqrt(dx * dx + dy * dy);
  }

  // The direction from a post to a point.
  function bearing(post, point) {
    var deg = Math.atan2(point[0] - post[0], point[1] - post[1]) / RAD;
    return (deg % 360 + 360) % 360;
  }

  // How much later the signal from the point arrives at the post `second` than at the post `first`.
  function delay(first, second, point, c) {
    return (far(point, second) - far(point, first)) / c;
  }

  // The place where a moved transmitter stands: the nearest point of the lattice, inside the map.
  function snap(d, point) {
    return [d.map.width, d.map.height].map(function (limit, k) {
      return Math.min(Math.max(Math.round(point[k] / d.snap) * d.snap, 0), limit);
    });
  }

  // The error at the position k of the slider: degrees for bearings, seconds for differences of times.
  function error(d, mode, k) {
    return k * d.sliders[mode].step;
  }

  // How many sectors or bands there are: the transmitter may be where a point lies in all of them.
  function all(d, mode) {
    return mode === "bearings" ? d.posts.length : d.pairs.length;
  }

  // A function that says in how many sectors (bearings) or bands (differences of times) the point (x, y) lies.
  function counter(d, mode, spot, err) {
    var posts = d.posts.map(function (p) { return p.at; });
    if (mode === "bearings") {
      var tan = Math.tan(err * RAD);
      var rays = posts.map(function (p) {
        var way = far(p, spot);
        return [p[0], p[1], (spot[0] - p[0]) / way, (spot[1] - p[1]) / way];
      });
      return function (x, y) {
        var n = 0, k, r, vx, vy, along;
        for (k = 0; k < rays.length; k += 1) {
          r = rays[k];
          vx = x - r[0];
          vy = y - r[1];
          along = vx * r[2] + vy * r[3];
          if (along > 0 && Math.abs(vx * r[3] - vy * r[2]) <= along * tan) { n += 1; }
        }
        return n;
      };
    }
    var wanted = d.pairs.map(function (pair) { return far(spot, posts[pair[1]]) - far(spot, posts[pair[0]]); });
    var slack = err * d.c, ways = new Float64Array(posts.length);
    return function (x, y) {
      var n = 0, k, dx, dy;
      for (k = 0; k < posts.length; k += 1) {
        dx = x - posts[k][0];
        dy = y - posts[k][1];
        ways[k] = Math.sqrt(dx * dx + dy * dy);
      }
      for (k = 0; k < d.pairs.length; k += 1) {
        if (Math.abs((ways[d.pairs[k][1]] - ways[d.pairs[k][0]]) - wanted[k]) <= slack) { n += 1; }
      }
      return n;
    };
  }

  // The picture of the sectors or bands: for each of nx × ny equal parts of the map, in how many of them its
  // centre lies. The first row is the northern one, as the rows of a picture run.
  function field(d, mode, spot, err, nx, ny) {
    var inside = counter(d, mode, spot, err), out = new Uint8Array(nx * ny);
    var sx = d.map.width / nx, sy = d.map.height / ny, i, j, y;
    for (j = 0; j < ny; j += 1) {
      y = (ny - 1 - j + 0.5) * sy;
      for (i = 0; i < nx; i += 1) { out[j * nx + i] = inside((i + 0.5) * sx, y); }
    }
    return out;
  }

  // The area of the place where the transmitter may be, m². The first pass marks the cells of the map whose
  // centre lies in all sectors or bands. The second pass cuts every marked cell, every cell near one and the
  // cells around the transmitter into parts × parts points and counts the points that lie in all of them. The
  // points of a cell stand on parts² different heights and widths, not in straight rows.
  function area(d, mode, spot, err) {
    var inside = counter(d, mode, spot, err), need = all(d, mode);
    var cell = d.cell, parts = d.parts;
    var nx = Math.round(d.map.width / cell), ny = Math.round(d.map.height / cell);
    var todo = new Uint8Array(nx * ny), i, j, a, b, points = 0;
    function spread(j0, i0, reach) {
      var jj, ii;
      for (jj = Math.max(j0 - reach, 0); jj <= Math.min(j0 + reach, ny - 1); jj += 1) {
        for (ii = Math.max(i0 - reach, 0); ii <= Math.min(i0 + reach, nx - 1); ii += 1) { todo[jj * nx + ii] = 1; }
      }
    }
    for (j = 0; j < ny; j += 1) {
      for (i = 0; i < nx; i += 1) {
        if (inside((i + 0.5) * cell, (j + 0.5) * cell) === need) { spread(j, i, d.near); }
      }
    }
    spread(Math.min(Math.floor(spot[1] / cell), ny - 1), Math.min(Math.floor(spot[0] / cell), nx - 1), d.around);
    for (j = 0; j < ny; j += 1) {
      for (i = 0; i < nx; i += 1) {
        if (!todo[j * nx + i]) { continue; }
        for (b = 0; b < parts; b += 1) {
          for (a = 0; a < parts; a += 1) {
            if (inside(i * cell + ((a + (b + 0.5) / parts) / parts) * cell,
                       j * cell + ((b + (a + 0.5) / parts) / parts) * cell) === need) { points += 1; }
          }
        }
      }
    }
    return points * (cell / parts) * (cell / parts);
  }

  // Points of the hyperbola on which the signal arrives at `second` later than at `first` by `wanted` seconds:
  // `count` points, the outer ones at least `reach` metres from the middle between the two posts.
  function curve(first, second, wanted, c, count, reach) {
    var half = far(first, second) / 2, ex = (second[0] - first[0]) / (2 * half), ey = (second[1] - first[1]) / (2 * half);
    var mx = (first[0] + second[0]) / 2, my = (first[1] + second[1]) / 2;
    var a = Math.max(Math.min(wanted * c / 2, half), -half), b = Math.sqrt(Math.max(half * half - a * a, 0));
    var most = Math.log(2 * (reach / Math.max(Math.abs(a), b) + 1)), out = [], k, t, u, v;
    for (k = 0; k < count; k += 1) {
      t = most * (2 * k / (count - 1) - 1);
      u = -a * Math.cosh(t);
      v = b * Math.sinh(t);
      out.push([mx + u * ex - v * ey, my + u * ey + v * ex]);
    }
    return out;
  }

  function num(x, digits) {
    return x.toFixed(digits).replace(".", ",");
  }

  // An area in km² as the page prints it: one digit after the comma, two when it is under one km².
  function areaText(squareMetres) {
    var km2 = squareMetres / 1e6;
    return num(km2, km2 >= 1 ? 1 : 2);
  }

  // The error at the position k of the slider as the page prints it.
  function errorText(d, mode, k) {
    var value = error(d, mode, k);
    if (mode === "bearings") { return num(value, Math.abs(value - Math.round(value)) < 1e-9 ? 0 : 1) + d.words.degree; }
    return num(value / 1e-6, 1) + d.words.us;
  }

  // The lines under the map: what the posts measure (for a pair of posts, which of the two hears the signal
  // later and by how much), and the area where the transmitter may be.
  function rows(d, mode, spot, found) {
    var w = d.words, last = w.area + areaText(found) + w.km2;
    if (mode === "bearings") {
      return [w.bearings + d.posts.map(function (p) {
        return p.id + " " + (Math.round(bearing(p.at, spot)) % 360) + w.degree;
      }).join(", "), last];
    }
    return d.pairs.map(function (pair) {
      var first = d.posts[pair[0]], second = d.posts[pair[1]], late = delay(first.at, second.at, spot, d.c);
      return first.id + w.pair + second.id + w.later[0] + (late >= 0 ? second.id : first.id) + w.later[1] +
        num(Math.abs(late) / 1e-6, 1) + w.later[2];
    }).concat([last]);
  }

  var api = { far: far, bearing: bearing, delay: delay, snap: snap, error: error, all: all, counter: counter,
              field: field, area: area, curve: curve, areaText: areaText, errorText: errorText, rows: rows };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    root.RerLocate = api;
  }
})(typeof self !== "undefined" ? self : this);
