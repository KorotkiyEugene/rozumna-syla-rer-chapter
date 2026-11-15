/* Page of topic 3: the cards of «Вправа № 1» and the model of an antenna array.
   The data of the exercise stand inside the page (window.RER_T3), written there by the scripts of the chapter.
   The beam of the array is computed by array.js (window.RerArray). */
(function () {
  "use strict";
  var D = window.RER_T3, A = window.RerArray;

  function el(tag, attrs, text) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    if (text !== undefined) { node.textContent = text; }
    return node;
  }

  // ---------------------------------------------------------------- the exercise: a card for each block and each step
  // A card wraps its questions onto as many lines as the screen needs, so the exercise is seen on a telephone too.
  var box = document.getElementById("answers");
  var cards = D.cards.map(function (c) {
    var card = el("fieldset", { "class": "card" });
    card.appendChild(el("legend", {}, c.title));
    var cells = c.questions.map(function (question) {
      var label = el("label"), select = el("select");
      label.appendChild(el("span", {}, question.title));
      select.appendChild(el("option", { value: "" }, "оберіть"));
      question.choices.forEach(function (choice) {
        // a choice is a word, or a pair [value, words] where the page keeps a value and shows words
        var pair = Array.isArray(choice) ? choice : [choice, choice];
        select.appendChild(el("option", { value: pair[0] }, pair[1]));
      });
      var mark = el("span", { "class": "mark" });
      label.appendChild(select);
      label.appendChild(mark);
      card.appendChild(label);
      select.addEventListener("change", function () { mark.textContent = ""; mark.className = "mark"; });
      // the key accepts a second answer to some questions: the page accepts it too
      return { accepted: [question.right].concat(question.also || []), select: select, mark: mark };
    });
    box.appendChild(card);
    return { card: c, cells: cells };
  });

  document.getElementById("check").addEventListener("click", function () {
    var right = 0, all = 0;
    cards.forEach(function (r) {
      r.cells.forEach(function (cell) {
        var ok = cell.accepted.indexOf(cell.select.value) !== -1;
        cell.mark.textContent = cell.select.value === "" ? "не обрано" : (ok ? "правильно" : "неправильно");
        cell.mark.className = "mark " + (ok ? "ok" : "no");
        right += ok ? 1 : 0;
        all += 1;
      });
    });
    document.getElementById("score").textContent = "Правильних відповідей: " + right + " з " + all + ".";
  });

  document.getElementById("explain").addEventListener("click", function () {
    var box = document.getElementById("explanations"), list = box.querySelector("ul");
    list.textContent = "";
    cards.forEach(function (r) {
      var item = el("li");
      item.appendChild(el("strong", {}, r.card.title + ". "));
      item.appendChild(document.createTextNode(r.card.answer));
      list.appendChild(item);
    });
    box.hidden = false;
  });

  // ---------------------------------------------------------------- the model of an antenna array
  // The picture is a view from above. The row of elements lies on the line y = Y0 with its middle at x = X0.
  // A direction is counted in degrees from that line: 0 is to the right, 90 is straight ahead (up).
  // The words «прямо», «ліворуч», «праворуч» are text of the page around the picture: they keep one size.
  // The curve is brought to one at its best direction, so the best direction always reaches RADIUS.
  var NS = "http://www.w3.org/2000/svg";
  var X0 = 200, Y0 = 184, RADIUS = 176;      // in the units of the viewBox of the picture: 400 by 192
  var CURVE_STEP = 0.5;                      // degrees between two neighbouring points of the curve
  var ELEMENT_PITCH = 8;                     // between the dots of two neighbouring elements
  var plot = document.getElementById("array-plot");
  var inputN = document.getElementById("array-n"), inputShift = document.getElementById("array-shift");
  var outN = document.getElementById("array-n-out"), outShift = document.getElementById("array-shift-out");
  var out = document.getElementById("array-out");

  function shape(tag, attrs) {
    var node = document.createElementNS(NS, tag);
    Object.keys(attrs).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    plot.appendChild(node);
    return node;
  }

  function at(degrees, r) {
    var a = degrees * Math.PI / 180;
    return (X0 + r * Math.cos(a)).toFixed(2) + "," + (Y0 - r * Math.sin(a)).toFixed(2);
  }

  function ray(degrees, name) {
    var end = at(degrees, RADIUS).split(",");
    shape("line", { x1: X0, y1: Y0, x2: end[0], y2: end[1], "class": name });
  }

  function draw() {
    var n = Number(inputN.value);
    var part = Math.round(Number(inputShift.value) * 100) / 100;       // the slider moves in steps of 0,05
    var directions = [], k, values, beam;
    outN.textContent = String(n);
    outShift.textContent = String(part).replace(".", ",").replace("-", "−");
    out.textContent = A.readout(n, part);
    plot.textContent = "";
    if (!(n >= D.array.min && n <= D.array.max && Math.abs(part) <= D.array.max_shift + 1e-9)) { return; }

    // the line of the elements, the half circle that the best direction reaches, the direction straight ahead
    shape("line", { x1: X0 - RADIUS, y1: Y0, x2: X0 + RADIUS, y2: Y0, "class": "grid" });
    shape("path", { d: "M" + (X0 - RADIUS) + " " + Y0 + " A" + RADIUS + " " + RADIUS + " 0 0 1 " + (X0 + RADIUS) + " " + Y0,
                    "class": "grid" });
    ray(90, "grid");

    // the curve: how well the row receives from each direction
    for (k = 0; k <= 180 / CURVE_STEP; k += 1) { directions.push(k * CURVE_STEP); }
    values = A.pattern(n, A.SPACING, A.shift(part), directions);
    shape("polygon", { points: directions.map(function (d, i) { return at(d, RADIUS * values[i]); }).join(" "),
                       "class": "curve" });

    // the edges of the beam: the directions from which the row receives half the power of the best one
    beam = A.beam(n, A.SPACING, A.shift(part));
    ray(beam.from, "edge");
    ray(beam.to, "edge");

    // the elements of the row
    for (k = 0; k < n; k += 1) {
      shape("circle", { cx: X0 + (k - (n - 1) / 2) * ELEMENT_PITCH, cy: Y0, r: 2.4, "class": "element" });
    }
  }

  inputN.addEventListener("input", draw);
  inputShift.addEventListener("input", draw);
  draw();
})();
