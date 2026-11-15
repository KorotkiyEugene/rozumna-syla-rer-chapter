/* Page of topic 2: the table of answers of «Вправа № 1» and the calculator of creative task 3.
   The data of the task stand inside the page (window.RER_T2), written there by the model of the area. */
(function () {
  "use strict";
  var D = window.RER_T2, R = window.RerRadio;

  function el(tag, attrs, text) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    if (text !== undefined) { node.textContent = text; }
    return node;
  }

  // A number stays on one line with the word after it: «395 нВт», «5 м».
  function glue(text) {
    return text.replace(/(\d) (?=[а-яіїєґА-ЯІЇЄҐ])/g, "$1\u00a0");
  }

  // ---------------------------------------------------------------- the exercise: a card for each signal
  // Five questions about every signal. A card wraps its questions onto as many lines as the screen needs,
  // so the whole exercise is seen on a telephone too: a table of six columns would hide its last ones.
  var QUESTIONS = [
    { key: "width", title: "Ширина смуги (крок 1)" },
    { key: "time", title: "У часі (крок 2)" },
    { key: "frequency", title: "За частотою (крок 2)" },
    { key: "source", title: "Джерело (крок 3)" },
    { key: "receives", title: "Чи покаже його спектрограма поста П1 (крок 4)" }
  ];
  var box = document.getElementById("answers");
  var rows = D.signals.map(function (s) {
    var card = el("fieldset", { "class": "card" });
    card.appendChild(el("legend", {}, "Сигнал " + s.n));
    var cells = QUESTIONS.map(function (question) {
      var label = el("label"), select = el("select");
      label.appendChild(el("span", {}, question.title));
      select.appendChild(el("option", { value: "" }, "оберіть"));
      D.choices[question.key].forEach(function (choice) {
        // a choice is a word of the table of portraits, or a pair [value, words] for the last question
        var pair = Array.isArray(choice) ? choice : [choice, choice];
        select.appendChild(el("option", { value: pair[0] }, pair[1]));
      });
      var mark = el("span", { "class": "mark" });
      label.appendChild(select);
      label.appendChild(mark);
      card.appendChild(label);
      select.addEventListener("change", function () { mark.textContent = ""; mark.className = "mark"; });
      return { right: s[question.key], select: select, mark: mark };
    });
    box.appendChild(card);
    return { signal: s, cells: cells };
  });

  document.getElementById("check").addEventListener("click", function () {
    var right = 0, all = 0;
    rows.forEach(function (r) {
      r.cells.forEach(function (cell) {
        var ok = cell.select.value === cell.right;
        cell.mark.textContent = cell.select.value === "" ? "не обрано" : (ok ? "правильно" : "неправильно");
        cell.mark.className = "mark " + (ok ? "ok" : "no");
        right += ok ? 1 : 0;
        all += 1;
      });
    });
    document.getElementById("score").textContent = "Правильних відповідей: " + right + " з " + all + ".";
  });

  document.getElementById("explain").addEventListener("click", function () {
    var box = document.getElementById("explanations"), list = box.querySelector("ol");
    list.textContent = "";
    rows.forEach(function (r) {
      var item = el("li");
      item.appendChild(el("strong", {}, "Сигнал " + r.signal.n + ". "));
      item.appendChild(document.createTextNode(r.signal.answer));
      list.appendChild(item);
    });
    box.hidden = false;
  });

  // ---------------------------------------------------------------- the calculator of the equation of Friis
  var inputs = ["calc-p", "calc-f", "calc-d"].map(function (id) { return document.getElementById(id); });
  var out = document.getElementById("calc-out"), table = document.querySelector("#calc-table tbody");

  function compute() {
    var v = inputs.map(function (input) { return input.value === "" ? NaN : Number(input.value); });
    out.textContent = glue(R.readout(D.c_m_s, v[0], v[1], v[2]));
    table.textContent = "";
    R.rows(D.c_m_s, v[0], v[1], v[2]).forEach(function (row) {
      var tr = el("tr");
      tr.appendChild(el("th", { scope: "row" }, glue(row[0])));
      tr.appendChild(el("td", {}, glue(row[1])));
      tr.appendChild(el("td", {}, glue(row[2])));
      table.appendChild(tr);
    });
  }

  document.getElementById("calc").addEventListener("submit", function (ev) {
    ev.preventDefault();
    compute();
  });
  inputs.forEach(function (input) { input.addEventListener("input", compute); });
  compute();
})();
