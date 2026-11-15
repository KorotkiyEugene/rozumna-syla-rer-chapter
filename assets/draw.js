/* Helpers of the live pictures of the site: a number as the chapter prints it, an element of a picture,
   a picture drawn point for point. One file for the pages and for the tests: node loads it as a module. */
(function (root) {
  "use strict";
  var NS = "http://www.w3.org/2000/svg";

  // A number with a decimal comma and a true minus sign, without the dust that arithmetic leaves behind
  // (3 · 0,1 = 0,30000000000000004). `digits`: places after the comma, two if not given.
  function number(x, digits) {
    var scale = Math.pow(10, digits === undefined ? 2 : digits);
    return String(Math.round(x * scale) / scale).replace(".", ",").replace("-", "\u2212");
  }

  // The width in points of the screen that a picture has on the page: the width of the block that holds it.
  function width(svg) {
    return Math.max(Math.round(svg.parentNode.getBoundingClientRect().width), 120);
  }

  // Empty a picture and give it a size in points of the screen. One unit of the picture is then one point, so
  // a word inside the picture has the size that the style of the page gives it, at any width of the window.
  function sheet(svg, wide, high) {
    svg.textContent = "";
    svg.setAttribute("viewBox", "0 0 " + wide + " " + high);
    svg.setAttribute("width", wide);
    svg.setAttribute("height", high);
  }

  // A new element inside a picture, or inside a part of it.
  function shape(parent, tag, attrs, text) {
    var node = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    if (text !== undefined) { node.textContent = text; }
    parent.appendChild(node);
    return node;
  }

  // The path through a list of points [x, y].
  function path(points) {
    return points.map(function (p, i) { return (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1); }).join(" ");
  }

  // The part of a straight line that lies inside a box: its two ends, or null when the line misses the box.
  // The line goes through (x, y) along (dx, dy); the box runs from (left, top) to (right, bottom). A picture
  // draws a long line only as far as it is seen, so that the ends of every line say where the line runs.
  function within(x, y, dx, dy, left, top, right, bottom) {
    var from = -Infinity, to = Infinity, a, b;
    function cut(start, step, low, high) {
      if (step === 0) { return start >= low && start <= high; }
      a = (low - start) / step;
      b = (high - start) / step;
      from = Math.max(from, Math.min(a, b));
      to = Math.min(to, Math.max(a, b));
      return true;
    }
    if (!cut(x, dx, left, right) || !cut(y, dy, top, bottom) || !(from < to)) { return null; }
    return [[x + from * dx, y + from * dy], [x + to * dx, y + to * dy]];
  }

  // An arrow from (x0, y0) to (x1, y1): a line and a head of the given length at its end.
  function arrow(parent, x0, y0, x1, y1, name, head) {
    var length = Math.sqrt((x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0)) || 1;
    var ux = (x1 - x0) / length, uy = (y1 - y0) / length, half = head * 0.42;
    shape(parent, "line", { x1: x0, y1: y0, x2: x1 - ux * head * 0.8, y2: y1 - uy * head * 0.8, "class": name });
    shape(parent, "polygon", { "class": name + " head", points: [
      [x1, y1], [x1 - ux * head - uy * half, y1 - uy * head + ux * half],
      [x1 - ux * head + uy * half, y1 - uy * head - ux * half]].map(function (p) {
      return p[0].toFixed(1) + "," + p[1].toFixed(1); }).join(" ") });
  }

  var api = { number: number, width: width, sheet: sheet, shape: shape, path: path, within: within, arrow: arrow };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    root.RerDraw = api;
  }
})(typeof self !== "undefined" ? self : this);
