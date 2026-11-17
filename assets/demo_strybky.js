/* The live picture of the hops of frequency on the page of topic 7: the plane «time, frequency», a cell for each
   hop of the transmitter and a strip for the band of the reconnaissance receiver. One slider sets how many
   frequencies the transmitter has, the other how many of them the receiver hears, and that slider stops at the number of frequencies of the transmitter. Every number comes from hop.js
   (window.RerHop): this file only draws. The limits of the sliders, the colours and the words come with the page
   (window.RER_T7.demo). The picture is drawn point for point (draw.js), so it is drawn again when the width of
   the window changes. */
(function () {
  "use strict";
  var H = window.RerHop, D = window.RerDraw, P = window.RER_T7.demo;
  var channels = document.getElementById("hop-channels");
  var band = document.getElementById("hop-band");
  var svg = document.getElementById("hop-plot");
  var told = document.getElementById("hop-out");
  var channelsOut = document.getElementById("hop-channels-out");
  var bandOut = document.getElementById("hop-band-out");
  if (!channels || !band || !svg) { return; }

  var LEFT = 26, RIGHT = 6, TOP = 8, BOTTOM = 24;      // room for the names of the axes, points of the screen
  var ROWS = P.channels.max;                           // the picture is as tall as the widest transmitter

  function draw() {
    var n = Number(channels.value);
    band.max = n;                                      // the receiver cannot hear more frequencies than there are
    var b = H.bandFor(n, Number(band.value));
    band.value = b;
    var order = H.sequence(n, P.hops, P.seed), low = H.bandLow(n, b), heard = Math.min(b, ROWS - low);   // the strip ends at the top of the picture
    var wide = Math.min(D.width(svg), 640), cell = (wide - LEFT - RIGHT) / P.hops;
    var row = Math.max(6, Math.min(9, Math.round(cell * 0.75)));
    var high = TOP + ROWS * row + BOTTOM, floor = TOP + ROWS * row;
    function y(channel) { return floor - (channel + 1) * row; }      // the top of the row of a frequency

    D.sheet(svg, wide, high);
    // The band of the transmitter, then the strip of the receiver inside it, then the hops.
    D.shape(svg, "rect", { x: LEFT, y: y(n - 1), width: wide - LEFT - RIGHT, height: n * row, fill: P.colours.own });
    D.shape(svg, "rect", { x: LEFT, y: y(low + heard - 1), width: wide - LEFT - RIGHT, height: heard * row, fill: P.colours.strip });
    order.forEach(function (c, t) {
      D.shape(svg, "rect", { x: LEFT + t * cell + cell * 0.08, y: y(c) + row * 0.1, width: cell * 0.84, height: row * 0.8,
                             fill: H.inside(c, n, b) ? P.colours.caught : P.colours.missed });
    });
    // The axes with their names.
    D.shape(svg, "line", { x1: LEFT, y1: TOP, x2: LEFT, y2: floor, stroke: P.colours.ink, "stroke-width": 1 });
    D.shape(svg, "line", { x1: LEFT, y1: floor, x2: wide - RIGHT, y2: floor, stroke: P.colours.ink, "stroke-width": 1 });
    D.shape(svg, "text", { x: LEFT + (wide - LEFT - RIGHT) / 2, y: high - 6, "class": "num" }, P.words.time + " →");
    D.shape(svg, "text", { x: 0, y: 0, "class": "num", transform: "translate(15 " + (TOP + ROWS * row / 2) + ") rotate(-90)" },
            P.words.frequency + " →");

    told.textContent = H.caughtText(H.caught(n, b, P.hops, P.seed), P.hops, P.words.caught);
    if (channelsOut) { channelsOut.textContent = n; }
    if (bandOut) { bandOut.textContent = b; }
  }

  channels.addEventListener("input", draw);
  band.addEventListener("input", draw);
  window.addEventListener("resize", draw);
  draw();
})();
