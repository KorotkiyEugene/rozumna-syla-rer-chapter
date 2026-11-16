/* Grouping of points without a hint, as the picture of topic 5 of the chapter shows it. Two points are
   neighbours when they lie within the reach of one another; a group is a set of points joined by chains of
   neighbours; a set of fewer points than `least` is not a group. One file for the page and for the tests:
   node loads it as a module. The same algorithm stands in pulse_example.py, and a test compares the two. */
(function (root) {
  "use strict";

  // The number of the group of every point, from 0 in the order of the mean frequency of the groups, or -1 for
  // a point without a group. `points`: [frequency, width]; `near`: the reach along each of the two.
  function groups(points, near, least) {
    var n = points.length, label = [], sets = [], i, j, start, queue, members;
    function neighbours(a, b) {
      var df = (a[0] - b[0]) / near[0], dw = (a[1] - b[1]) / near[1];
      return df * df + dw * dw <= 1.0;
    }
    for (i = 0; i < n; i += 1) { label.push(-1); }
    for (start = 0; start < n; start += 1) {
      if (label[start] >= 0) { continue; }
      members = [start];
      queue = [start];
      label[start] = sets.length;
      while (queue.length) {
        i = queue.pop();
        for (j = 0; j < n; j += 1) {
          if (label[j] < 0 && neighbours(points[i], points[j])) {
            label[j] = sets.length;
            members.push(j);
            queue.push(j);
          }
        }
      }
      sets.push(members);
    }
    function mean(list) {
      return list.reduce(function (sum, k) { return sum + points[k][0]; }, 0) / list.length;
    }
    var kept = sets.filter(function (list) { return list.length >= least; });
    kept.sort(function (a, b) { return mean(a) - mean(b); });
    var out = [];
    for (i = 0; i < n; i += 1) { out.push(-1); }
    kept.forEach(function (list, number) { list.forEach(function (k) { out[k] = number; }); });
    return out;
  }

  // [how many groups, how many points without a group]
  function count(found) {
    var most = -1, alone = 0;
    found.forEach(function (g) { if (g < 0) { alone += 1; } else if (g > most) { most = g; } });
    return [most + 1, alone];
  }

  // The reach at a step of the slider, in reaches of the picture of the chapter: the steps are even in the
  // logarithm, so that a small reach and a large one get the same room on the slider.
  function factor(step, low, high, steps) {
    return low * Math.pow(high / low, step / steps);
  }

  // The reach as the label of the slider prints it: along the frequency (MHz) and along the pulse width
  // (microseconds). `near` is the reach of the picture of the chapter, `k` the factor of the slider.
  function reachText(near, k, words) {
    var f = near[0] * k, w = near[1] * k;
    return (f < 10 ? f.toFixed(1) : f.toFixed(0)).replace(".", ",") + words.reach[0] +
      w.toFixed(2).replace(".", ",") + words.reach[1];
  }

  // A colour "#rrggbb" mixed with white: `share` of white. A disc is drawn in such a flat colour.
  function tint(colour, share) {
    var out = "#", i, c;
    for (i = 1; i < 7; i += 2) {
      c = parseInt(colour.slice(i, i + 2), 16);
      c = Math.round(c + (255 - c) * share);
      out += (c < 16 ? "0" : "") + c.toString(16);
    }
    return out;
  }

  // The radius of a point on the screen, where one reach of the picture of the chapter takes `unit` points of the
  // screen: small enough to leave the disc around the point visible in a narrow window.
  function dot(unit) {
    return Math.max(1.6, Math.min(3.2, unit * 0.085));
  }

  var api = { groups: groups, count: count, factor: factor, reachText: reachText, tint: tint, dot: dot };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    root.RerClusters = api;
  }
})(typeof self !== "undefined" ? self : this);
