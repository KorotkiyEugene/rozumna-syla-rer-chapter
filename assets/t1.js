/* Page of topic 1: the questions of «Вправа № 1» and the tool that moves post П1 on the map.
   The data of the task stand inside the page (window.RER_T1), written there by the model of the area. */
(function () {
  "use strict";
  var D = window.RER_T1, A = window.RerArea;
  var WHO = { "П1": "пост П1", "А": "аеростат А", "ніхто": "ніхто" };
  var SVG = "http://www.w3.org/2000/svg";

  var num = A.num;

  // A number stays on one line with the word after it: «21,8 км», «2 м».
  function glue(text) {
    return text.replace(/(\d) (?=[а-яіїєґА-ЯІЇЄҐ])/g, "$1\u00a0");
  }

  function el(tag, attrs, text) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    if (text !== undefined) { node.textContent = text; }
    return node;
  }

  // ---------------------------------------------------------------- steps 1 to 3: a card for each source
  // Two questions about every source and a line for the explanation. A card wraps its questions onto as many
  // lines as the screen needs, so a telephone shows the whole of it: a table would hide its last column.
  var box = document.getElementById("answers");
  var rows = D.sources.map(function (s) {
    var card = el("fieldset", { "class": "card" });
    card.appendChild(el("legend", {}, s.id + " " + s.name));
    function choice(options, title) {
      var label = el("label"), select = el("select");
      label.appendChild(el("span", {}, title));
      select.appendChild(el("option", { value: "" }, "оберіть"));
      options.forEach(function (o) { select.appendChild(el("option", { value: o[0] }, o[1])); });
      var mark = el("span", { "class": "mark" });
      label.appendChild(select);
      label.appendChild(mark);
      card.appendChild(label);
      select.addEventListener("change", function () { mark.textContent = ""; mark.className = "mark"; });
      return { select: select, mark: mark };
    }
    var kind = choice([["РР", "РР"], ["РТР", "РТР"]], "Напрям (крок 1)");
    var who = choice([["П1", WHO["П1"]], ["А", WHO["А"]], ["ніхто", WHO["ніхто"]]],
                     "Хто приймає о " + D.time + " (крок 2)");
    var explain = el("p", { "class": "explain" });
    card.appendChild(explain);
    box.appendChild(card);
    return { source: s, kind: kind, who: who, explain: explain };
  });

  function judge(cell, right) {
    var ok = cell.select.value === right;
    cell.mark.textContent = cell.select.value === "" ? "не обрано" : (ok ? "правильно" : "неправильно");
    cell.mark.className = "mark " + (ok ? "ok" : "no");
    return ok ? 1 : 0;
  }

  document.getElementById("check").addEventListener("click", function () {
    var right = 0;
    rows.forEach(function (r) {
      right += judge(r.kind, r.source.kind);
      right += judge(r.who, r.source.receivers.length ? r.source.receivers[0] : "ніхто");
    });
    document.getElementById("score").textContent = "Правильних відповідей: " + right + " з " + 2 * rows.length + ".";
  });

  document.getElementById("explain").addEventListener("click", function () {
    rows.forEach(function (r) {
      var who = r.source.receivers.length ? WHO[r.source.receivers[0]] : "ніхто";
      r.explain.textContent = r.source.kind + ", " + who + ". " + r.source.explain;
    });
  });

  // ---------------------------------------------------------------- step 4: the post at another place
  // two layers over the map: lines that only darken it, and above them the mark of the new place with its name
  var g = D.picture, lines = document.querySelector("#map svg.lines"), svg = document.querySelector("#map svg.marks");
  var out = document.getElementById("place-out"), inX = document.getElementById("px"), inY = document.getElementById("py");

  function mmX(xKm) { return g.left_mm + xKm * g.mm_per_km; }
  function mmY(yKm) { return g.height_mm - g.bottom_mm - yKm * g.mm_per_km; }

  function shape(layer, tag, attrs) {
    var node = document.createElementNS(SVG, tag);
    Object.keys(attrs).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    layer.appendChild(node);
    return node;
  }

  // the new boundary is cut by the edge of the area, as the printed one is
  var clip = shape(lines, "clipPath", { id: "area" });
  var frame = document.createElementNS(SVG, "rect");
  frame.setAttribute("x", mmX(0));
  frame.setAttribute("y", mmY(D.map.height_km));
  frame.setAttribute("width", D.map.width_km * g.mm_per_km);
  frame.setAttribute("height", D.map.height_km * g.mm_per_km);
  clip.appendChild(frame);
  var ring = shape(lines, "circle", { fill: "none", stroke: "#00929A", "stroke-width": 0.55, "clip-path": "url(#area)", visibility: "hidden" });
  var link = shape(lines, "line", { stroke: "#8b979d", "stroke-width": 0.4, "stroke-dasharray": "1.2 1", visibility: "hidden" });
  var spot = shape(svg, "rect", { width: 3.4, height: 3.4, fill: "#ffffff", stroke: "#00929A", "stroke-width": 0.9, visibility: "hidden" });
  // the name of the new place: ink with a white edge, as the labels of the printed map
  var name = shape(svg, "text", { "font-size": 2.6, "font-weight": 700, fill: "#1f2a30", stroke: "#ffffff", "stroke-width": 0.8,
                             "stroke-linejoin": "round", "paint-order": "stroke", visibility: "hidden" });
  name.textContent = D.post.id + ", нове місце";
  var marks = [ring, link, spot, name];

  function hide() {
    marks.forEach(function (node) { node.setAttribute("visibility", "hidden"); });
  }

  function show(x, y) {
    if (!(x >= 0 && x <= D.map.width_km && y >= 0 && y <= D.map.height_km)) {
      hide();
      out.textContent = glue("Район має розміри " + num(D.map.width_km, 0) + " на " + num(D.map.height_km, 0) + " км. Оберіть точку в його межах.");
      return;
    }
    var p = A.place(D, x, y);
    var where = "(" + num(p.x_km) + "; " + num(p.y_km) + ")";
    if (!p.own_side) {
      hide();
      out.textContent = "Точка " + where + " лежить на боці умовного противника. Пост там не поставити.";
      return;
    }
    var target = D.sources.filter(function (s) { return s.id === D.target; })[0];
    ring.setAttribute("cx", mmX(p.x_km));
    ring.setAttribute("cy", mmY(p.y_km));
    ring.setAttribute("r", p.reach_km * g.mm_per_km);
    link.setAttribute("x1", mmX(p.x_km));
    link.setAttribute("y1", mmY(p.y_km));
    link.setAttribute("x2", mmX(target.x_km));
    link.setAttribute("y2", mmY(target.y_km));
    spot.setAttribute("x", mmX(p.x_km) - 1.7);
    spot.setAttribute("y", mmY(p.y_km) - 1.7);
    // the name stands to the right of the mark, and to the left of it near the right edge of the area
    var atRight = p.x_km > D.map.width_km - 10;
    name.setAttribute("x", mmX(p.x_km) + (atRight ? -2.6 : 2.6));
    name.setAttribute("y", mmY(p.y_km) - 2.4);
    name.setAttribute("text-anchor", atRight ? "end" : "start");
    marks.forEach(function (node) { node.setAttribute("visibility", "visible"); });
    inX.value = p.x_km;
    inY.value = p.y_km;
    out.textContent = glue(A.readout(D, p));
  }

  svg.addEventListener("click", function (ev) {
    var r = svg.getBoundingClientRect();
    var xMm = (ev.clientX - r.left) / r.width * g.width_mm, yMm = (ev.clientY - r.top) / r.height * g.height_mm;
    var x = (xMm - g.left_mm) / g.mm_per_km, y = (g.height_mm - g.bottom_mm - yMm) / g.mm_per_km;
    show(Math.round(x * 2) / 2, Math.round(y * 2) / 2);      // to the nearest half of a kilometre
  });
  document.getElementById("place").addEventListener("submit", function (ev) {
    ev.preventDefault();
    show(parseFloat(inX.value), parseFloat(inY.value));
  });
  document.getElementById("to-hill").addEventListener("click", function () { show(D.hill.x_km, D.hill.y_km); });
  document.getElementById("reset").addEventListener("click", function () {
    hide();
    inX.value = D.post.x_km;
    inY.value = D.post.y_km;
    out.textContent = "Пост П1 стоїть на своєму місці, як на карті.";
  });
})();
