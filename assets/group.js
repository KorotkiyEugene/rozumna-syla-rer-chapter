/* Places of transmitters found during a day and an algorithm that sorts them into groups, as topic 8 of the
   chapter counts them. Every object is found several times, each time moved by an error. The errors come from
   the generator of Park and Miller, x' = 48271 x mod (2^31 - 1): whole numbers only, and 48271 * (2^31 - 1) stays
   below 2^53, so JavaScript counts it exactly. An error is the sum of `terms` numbers between 0 and 1 minus the
   half of `terms`. The algorithm (k-means) starts from the first place and then from the places farthest from
   the centres chosen so far; after that every place goes to its nearest centre and every centre moves to the
   mean of its places, until nothing changes. One file for the page and for the tests: node loads it as a module.
   The same computations stand in group_example.py, and a test compares the two at every position of the sliders
   of the page. */
(function (root) {
  "use strict";
  var MULTIPLIER = 48271, MODULUS = 2147483647, ROUNDS = 100;

  // `count` errors with the mean 0 and the spread 1.
  function unitErrors(count, seed, terms) {
    var x = seed, out = [], i, j, total;
    for (i = 0; i < count; i += 1) {
      total = 0;
      for (j = 0; j < terms; j += 1) {
        x = x * MULTIPLIER % MODULUS;
        total += x / MODULUS;
      }
      out.push(total - terms / 2);
    }
    return out;
  }

  // The places found during the day: every object `per` times, moved by the error east and north.
  // `objects`: [x, y] in metres; `error` in metres.
  function places(objects, per, error, seed, terms) {
    var errors = unitErrors(2 * objects.length * per, seed, terms), out = [], o, k, i;
    for (o = 0; o < objects.length; o += 1) {
      for (k = 0; k < per; k += 1) {
        i = out.length;
        out.push({ object: o, x: objects[o][0] + error * errors[2 * i], y: objects[o][1] + error * errors[2 * i + 1] });
      }
    }
    return out;
  }

  function far(p, c) {
    return (p.x - c[0]) * (p.x - c[0]) + (p.y - c[1]) * (p.y - c[1]);
  }

  // The nearest centre of a place: its number and the square of the distance to it.
  function nearest(p, centres) {
    var best = 0, least = far(p, centres[0]), g, d;
    for (g = 1; g < centres.length; g += 1) {
      d = far(p, centres[g]);
      if (d < least) { best = g; least = d; }
    }
    return [best, least];
  }

  // Sort the places into `groups` groups: the group of every place, the centres and the sizes of the groups.
  function sort(groups, pts) {
    var centres = [[pts[0].x, pts[0].y]], group = [], fresh, same, best, most, d, i, g, round, sx, sy, n, sizes = [];
    while (centres.length < groups) {
      best = 0;
      most = -1;
      for (i = 0; i < pts.length; i += 1) {
        d = nearest(pts[i], centres)[1];
        if (d > most) { best = i; most = d; }
      }
      centres.push([pts[best].x, pts[best].y]);
    }
    for (i = 0; i < pts.length; i += 1) { group.push(-1); }
    for (round = 0; round < ROUNDS; round += 1) {
      fresh = pts.map(function (p) { return nearest(p, centres)[0]; });
      same = fresh.every(function (key, at) { return key === group[at]; });
      if (same) { break; }
      group = fresh;
      for (g = 0; g < groups; g += 1) {
        sx = 0; sy = 0; n = 0;
        for (i = 0; i < pts.length; i += 1) {
          if (group[i] === g) { sx += pts[i].x; sy += pts[i].y; n += 1; }
        }
        if (n) { centres[g] = [sx / n, sy / n]; }
      }
    }
    for (g = 0; g < groups; g += 1) {
      sizes.push(group.filter(function (key) { return key === g; }).length);
    }
    return { group: group, centres: centres, sizes: sizes };
  }

  // How well the groups fit the objects. A group belongs to the object that has most places in it (the first
  // such object). `right`: the places that sit in a group of their own object. `merged`: the objects that own
  // no group. `split`: the objects that own more than one group.
  function score(group, pts, objects, groups) {
    var owner = [], owned = [], g, o, counts, most, right = 0, merged = 0, split = 0, i;
    for (o = 0; o < objects; o += 1) { owned.push(0); }
    for (g = 0; g < groups; g += 1) {
      counts = [];
      for (o = 0; o < objects; o += 1) { counts.push(0); }
      for (i = 0; i < pts.length; i += 1) {
        if (group[i] === g) { counts[pts[i].object] += 1; }
      }
      most = 0;
      for (o = 1; o < objects; o += 1) {
        if (counts[o] > counts[most]) { most = o; }
      }
      owner.push(most);
      owned[most] += 1;
    }
    for (i = 0; i < pts.length; i += 1) {
      if (pts[i].object === owner[group[i]]) { right += 1; }
    }
    for (o = 0; o < objects; o += 1) {
      if (owned[o] === 0) { merged += 1; }
      if (owned[o] > 1) { split += 1; }
    }
    return { owner: owner, right: right, merged: merged, split: split };
  }

  // The colour of every group, as a number in the list of colours. The first group of an object wears the
  // colour of that object (the number of the object), so a colour stays with its object when the sliders move.
  // A further group of the same object takes the free colour that is the least like the colour of the object:
  // a spare one (the numbers from `objects` upwards) while a spare one is free, and only then a colour of an
  // object that owns no group. `far[c]` lists the other colours from the least like colour c to the most.
  function colours(owner, objects, far) {
    var out = [], taken = [], g, c, k, pick;
    for (c = 0; c < far.length; c += 1) { taken.push(false); }
    for (g = 0; g < owner.length; g += 1) {
      if (taken[owner[g]]) {
        out.push(-1);
      } else {
        out.push(owner[g]);
        taken[owner[g]] = true;
      }
    }
    for (g = 0; g < owner.length; g += 1) {
      if (out[g] < 0) {
        pick = -1;
        for (k = 0; k < far[owner[g]].length && pick < 0; k += 1) {
          c = far[owner[g]][k];
          if (!taken[c] && c >= objects) { pick = c; }
        }
        for (k = 0; k < far[owner[g]].length && pick < 0; k += 1) {
          c = far[owner[g]][k];
          if (!taken[c]) { pick = c; }
        }
        out[g] = pick;
        taken[pick] = true;
      }
    }
    return out;
  }

  // The result as the page prints it: `words` are the words before, between and after the four numbers.
  function told(merged, split, wrong, total, words) {
    return words[0] + merged + words[1] + split + words[2] + wrong + words[3] + total + words[4];
  }

  var api = { unitErrors: unitErrors, places: places, sort: sort, score: score, colours: colours, told: told };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    root.RerGroup = api;
  }
})(typeof self !== "undefined" ? self : this);
