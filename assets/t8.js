/* Page of topic 8: the cards of «Вправа № 1».
   The data of the exercise stand inside the page (window.RER_T8), written there by the scripts of the chapter. */
(function () {
  "use strict";
  var D = window.RER_T8;

  function el(tag, attrs, text) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    if (text !== undefined) { node.textContent = text; }
    return node;
  }

  // ---------------------------------------------------------------- the exercise: a card for each step
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
        select.appendChild(el("option", { value: choice }, choice));
      });
      var mark = el("span", { "class": "mark" });
      label.appendChild(select);
      label.appendChild(mark);
      card.appendChild(label);
      select.addEventListener("change", function () { mark.textContent = ""; mark.className = "mark"; });
      return { right: question.right, select: select, mark: mark };
    });
    box.appendChild(card);
    return { card: c, cells: cells };
  });

  document.getElementById("check").addEventListener("click", function () {
    var right = 0, all = 0;
    cards.forEach(function (r) {
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
})();
