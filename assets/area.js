/* Geometry of the training area. The formulas repeat the model of the area (scenario/area_model.py),
   and a test runs both and compares their results. Distances on the map are in kilometres, heights in metres. */
(function (root) {
  "use strict";

  // Distance in metres to the radio horizon from the height h over a smooth Earth.
  function horizonPart(d, h) {
    return Math.sqrt(2 * d.refraction * d.earth_radius_m * h);
  }

  // How far, in kilometres, an antenna at the height h1 has a straight path to an antenna at the height h2.
  function reachKm(d, h1, h2) {
    return (horizonPart(d, h1) + horizonPart(d, h2)) / 1000;
  }

  function dist(ax, ay, bx, by) {
    return Math.hypot(bx - ax, by - ay);
  }

  // Where the conditional line crosses the height y of the map: its x.
  function lineX(line, y) {
    for (var i = 0; i + 1 < line.length; i++) {
      var a = line[i], b = line[i + 1];
      if (Math.min(a[1], b[1]) <= y && y <= Math.max(a[1], b[1])) {
        return a[0] + (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]);
      }
    }
    return NaN;
  }

  // Shortest distance from the point (x, y) to the conditional line: to the nearest point of its nearest segment.
  function toLine(line, x, y) {
    var best = Infinity;
    for (var i = 0; i + 1 < line.length; i++) {
      var a = line[i], b = line[i + 1], dx = b[0] - a[0], dy = b[1] - a[1];
      var t = ((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy);
      t = Math.min(1, Math.max(0, t));
      best = Math.min(best, dist(x, y, a[0] + t * dx, a[1] + t * dy));
    }
    return best;
  }

  // What the post gets when it stands at (x, y). A place near the top of the hill counts as the top.
  function place(d, x, y) {
    var onHill = dist(x, y, d.hill.x_km, d.hill.y_km) <= d.hill.snap_km;
    if (onHill) {
      x = d.hill.x_km;
      y = d.hill.y_km;
    }
    var height = d.post.h_m + (onHill ? d.hill.rise_m : 0);
    var target = d.sources.filter(function (s) { return s.id === d.target; })[0];
    var reach = reachKm(d, height, d.low_antenna_m);
    var toTarget = dist(x, y, target.x_km, target.y_km);
    return {
      x_km: x, y_km: y, on_hill: onHill, height_m: height, reach_km: reach,
      own_side: x < lineX(d.line_km, y), to_line_km: toLine(d.line_km, x, y),
      to_target_km: toTarget, receives_target: toTarget <= reach
    };
  }

  // A number as the chapter prints it: with a decimal comma.
  function num(value, digits) {
    return value.toFixed(digits === undefined ? 1 : digits).replace(".", ",");
  }

  // The sentence under the map for the post at a place of our side: p is what place() returned.
  function readout(d, p) {
    return "Пост " + d.post.id + " у точці (" + num(p.x_km) + "; " + num(p.y_km) + ") км" +
      (p.on_hill ? ", на пагорбі: антена поста на " + num(d.hill.rise_m, 0) + " м вище. " : ". ") +
      "Звідси пост «чує» передавач з антеною на висоті " + num(d.low_antenna_m, 0) + " м на відстані до " + num(p.reach_km) + " км. " +
      "До " + d.target + " звідси " + num(p.to_target_km) + " км, тож пост " +
      (p.receives_target ? "приймає сигнал " : "не приймає сигналу ") + d.target + ". " +
      "До умовної лінії " + num(p.to_line_km) + " км.";
  }

  var api = { reachKm: reachKm, lineX: lineX, toLine: toLine, place: place, num: num, readout: readout };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    root.RerArea = api;
  }
})(typeof self !== "undefined" ? self : this);
