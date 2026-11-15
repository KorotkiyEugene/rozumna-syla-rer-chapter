/* The model of an antenna array of the page of topic 3: a row of equal elements that stand half a wavelength
   apart before a screen, so each element receives only from the front. The array holds the signal of every next
   element longer by the same delay and then adds the signals. One file for the page and for the tests: node
   loads it as a module. The curve is the curve of figure 3.5 (в) of the chapter, and the times of the wave at
   the elements are those of its panel (г): the tests compare both with the script of the figure.

   The elements are counted from the left of the picture. A direction is in degrees from the line of the
   elements: 0 is to the right, 90 is straight ahead. A time is in periods of the wave. */
(function (root) {
  "use strict";

  var SPACING = 0.5;               // the distance between neighbouring elements, in wavelengths
  var MIN_ELEMENTS = 2, MAX_ELEMENTS = 16;
  var MAX_SHIFT = 0.3;             // the largest delay between neighbours of the page, in periods of the wave
  var MAX_TURN = 60;               // the transmitter of the page stands at most this far from straight ahead, degrees
  var HALF_POWER = Math.SQRT1_2;   // the curve shows the size of the signal: half the power is 1/√2 of the size

  // A shift between neighbours given in parts of a period, in radians: a whole period is a full turn.
  function shift(part) {
    return 2 * Math.PI * part;
  }

  // The size of the sum of the signals from one direction, not yet brought to one at the best direction.
  // The direction is in degrees from the line of the elements: 90 is straight ahead.
  function sum(n, spacing, shiftRad, degrees) {
    var a = degrees * Math.PI / 180;
    var phase = 2 * Math.PI * spacing * Math.cos(a) - shiftRad;
    var re = 0, im = 0, k;
    for (k = 0; k < n; k += 1) {
      re += Math.cos(k * phase);
      im += Math.sin(k * phase);
    }
    return Math.sqrt(re * re + im * im) / n * Math.max(Math.sin(a), 0);
  }

  // The best direction and the sum there: a grid of a tenth of a degree, then a grid of a ten-thousandth
  // around its best point. The script of the figure looks for the greatest value in the same way.
  function peak(n, spacing, shiftRad) {
    var best = 0, top = -1, i, d, v, near;
    for (i = 0; i <= 1800; i += 1) {
      d = i / 10;
      v = sum(n, spacing, shiftRad, d);
      if (v > top) { top = v; best = d; }
    }
    near = best;
    top = -1;
    for (i = 0; i <= 2000; i += 1) {
      d = near - 0.1 + i * 0.0001;
      v = sum(n, spacing, shiftRad, d);
      if (v > top) { top = v; best = d; }
    }
    return { direction: best, value: top };
  }

  // How well the row receives from each of the directions, brought to one at its best direction.
  function pattern(n, spacing, shiftRad, degrees) {
    var top = peak(n, spacing, shiftRad).value;
    return degrees.map(function (d) { return sum(n, spacing, shiftRad, d) / top; });
  }

  // The direction beside the best one from which the row receives half the power: `step` is +1 or -1.
  function edge(n, spacing, shiftRad, p, step) {
    var inside = p.direction, outside = p.direction, middle, i;
    do {
      inside = outside;
      outside = Math.min(180, Math.max(0, inside + step * 0.05));
    } while (sum(n, spacing, shiftRad, outside) > HALF_POWER * p.value && outside !== inside);
    for (i = 0; i < 40; i += 1) {
      middle = (inside + outside) / 2;
      if (sum(n, spacing, shiftRad, middle) > HALF_POWER * p.value) { inside = middle; } else { outside = middle; }
    }
    return (inside + outside) / 2;
  }

  // The beam: its best direction and the two directions between which the row receives at least half the
  // power of the best one. The angle between these two is the width of the beam.
  function beam(n, spacing, shiftRad) {
    var p = peak(n, spacing, shiftRad);
    return { best: p.direction, from: edge(n, spacing, shiftRad, p, -1), to: edge(n, spacing, shiftRad, p, 1) };
  }

  // How much later than the element it reaches first the wave of a far transmitter reaches each element.
  // A neighbour that lies further from the transmitter gets the wave later by the part of a wavelength that
  // the wave still has to travel: the distance between the elements times the cosine of the direction.
  function arrival(n, spacing, degrees) {
    var step = spacing * Math.cos(degrees * Math.PI / 180), out = [], k;
    for (k = 0; k < n; k += 1) { out.push(step >= 0 ? (n - 1 - k) * step : -k * step); }
    return out;
  }

  // How long the array holds the signal of each element. A delay cannot be negative, so the end of the row
  // that waits least waits nothing: with a positive `part` it is the left end.
  function delays(n, part) {
    var out = [], k;
    for (k = 0; k < n; k += 1) { out.push(part >= 0 ? k * part : -(n - 1 - k) * part); }
    return out;
  }

  // A signal of size one at the moment t: a sine that begins later by `lag`.
  function signal(t, lag) {
    return Math.sin(2 * Math.PI * (t - lag));
  }

  // The signals at the adder: `lags` says when each of them comes (after the way of the wave and the delay of
  // the array). `times` says how many times their sum is larger than the signal of one element, and `share`
  // the part that the sum makes of the largest possible one, which the signals give when they all come together.
  function added(n, spacing, part, degrees) {
    var reach = arrival(n, spacing, degrees), hold = delays(n, part);
    var lags = [], re = 0, im = 0, k, size;
    for (k = 0; k < n; k += 1) {
      lags.push(reach[k] + hold[k]);
      re += Math.cos(2 * Math.PI * lags[k]);
      im -= Math.sin(2 * Math.PI * lags[k]);
    }
    size = Math.sqrt(re * re + im * im);
    return { times: size, share: size / n, lags: lags, arrival: reach, delays: hold };
  }

  // The part of a period that a picture shows of a delay: an oscillation repeats itself, so a signal held for
  // 1,25 of a period looks as one held for 0,25.
  function shown(delay) {
    var part = delay - Math.floor(delay + 1e-9);
    return part < 1e-9 ? 0 : part;
  }

  // The places of the elements along the row, in wavelengths, from the left: the middle of the row is zero.
  function places(n, spacing) {
    var out = [], k;
    for (k = 0; k < n; k += 1) { out.push((k - (n - 1) / 2) * spacing); }
    return out;
  }

  // How far from the middle of the row, along the direction to the transmitter, the first crest of the wave is
  // at the moment when it reaches the first element, in wavelengths.
  function front(n, spacing, degrees) {
    return (n - 1) / 2 * spacing * Math.abs(Math.cos(degrees * Math.PI / 180));
  }

  // Lines through the crests of signals whose lags grow evenly from the first row to the last. A crest of
  // a signal comes a quarter of a period after its lag and then every period. For every crest that the first
  // or the last signal has inside `span` periods: the moments of that crest in the first row and in the last.
  function crests(lags, span) {
    var first = lags[0] + 0.25, last = lags[lags.length - 1] + 0.25, out = [], m;
    for (m = Math.ceil(-Math.max(first, last) - 1e-9); m <= Math.floor(span - Math.min(first, last) + 1e-9); m += 1) {
      out.push([first + m, last + m]);
    }
    return out;
  }

  // How well a transmitter in one direction is heard: from 0 to 1 of the best direction of the row.
  function heard(n, spacing, shiftRad, degrees) {
    return sum(n, spacing, shiftRad, degrees) / peak(n, spacing, shiftRad).value;
  }

  function whole(x) {
    return Math.floor(x + 0.5);
  }

  function plain(x) {
    return String(x).replace(".", ",").replace("-", "−");
  }

  // The sentence under the picture of the beam. A positive delay turns the beam to the right of the picture.
  function readout(n, part) {
    var fits = typeof n === "number" && typeof part === "number" && isFinite(n) && isFinite(part) &&
               Math.floor(n) === n && n >= MIN_ELEMENTS && n <= MAX_ELEMENTS && Math.abs(part) <= MAX_SHIFT + 1e-9;
    if (!fits) {
      return "Оберіть кількість елементів від " + MIN_ELEMENTS + " до " + MAX_ELEMENTS + " і затримку, не більшу за " +
             plain(MAX_SHIFT) + "\u00a0періоду.";
    }
    var b = beam(n, SPACING, shift(part));
    var turn = whole(Math.abs(90 - b.best));
    var where = turn === 0 ? "Промінь спрямовано прямо перед решіткою."
                           : "Промінь повернуто на " + turn + "° " + (b.best < 90 ? "праворуч" : "ліворуч") + ".";
    return where + " Ширина променя " + whole(b.to - b.from) + "°.";
  }

  // Where a direction lies for a reader who looks at the picture: counted from the direction straight ahead.
  function side(degrees) {
    var turn = whole(Math.abs(90 - degrees));
    return turn === 0 ? "прямо перед решіткою" : "на " + turn + "° " + (degrees < 90 ? "праворуч" : "ліворуч");
  }

  // «у 4 рази», «у 8 разів»: how many times, for the counts of elements of the page.
  function timesWord(n) {
    return "у " + n + (n >= 2 && n <= 4 ? " рази" : " разів");
  }

  // How the sum of the signals is told, with the delay `part` between neighbours.
  function sumWords(n, part, degrees) {
    var perCent = whole(100 * added(n, SPACING, part, degrees).share);
    return perCent === 100 ? "сигнали збігаються: сума " + timesWord(n) + " більша за сигнал одного елемента"
         : perCent === 0 ? "сигнали гасять один одного: суми майже немає"
         : "сума сигналів становить " + perCent + "\u00a0% від найбільшої можливої";
  }

  // The sentences under the pictures of the wave and of the signals: where the transmitter stands, which
  // element its wave reaches first, how the signals add up without the delays and with them.
  function told(n, part, degrees) {
    var fits = typeof n === "number" && typeof part === "number" && typeof degrees === "number" && isFinite(degrees) &&
               Math.floor(n) === n && n >= MIN_ELEMENTS && n <= MAX_ELEMENTS && Math.abs(part) <= MAX_SHIFT + 1e-9 &&
               Math.abs(90 - degrees) <= MAX_TURN + 1e-9;
    if (!fits) {
      return "Оберіть напрямок на передавач: не далі ніж " + MAX_TURN + "° від напрямку прямо.";
    }
    var where = "Передавач стоїть " + side(degrees) + ": хвиля доходить до ";
    var plain = sumWords(n, 0, degrees);
    if (whole(Math.abs(90 - degrees)) === 0) {
      where += "всіх елементів одночасно.";
    } else {
      where += "елемента " + (degrees < 90 ? n : 1) + " раніше, ніж до елемента " + (degrees < 90 ? 1 : n) + ".";
    }
    if (part === 0) {
      return where + " Затримок немає. " + plain.charAt(0).toUpperCase() + plain.slice(1) + ".";
    }
    return where + " Без затримок " + plain + ". Із затримками " + sumWords(n, part, degrees) + ".";
  }

  // The words beside the slider of the delay: its size and the side to which the delays grow. With a positive
  // delay every next element to the right is held longer.
  function held(part) {
    if (part === 0) { return "без затримок"; }
    return plain(Math.abs(part)) + "\u00a0періоду, зростає " + (part > 0 ? "праворуч" : "ліворуч");
  }

  var api = { SPACING: SPACING, MIN_ELEMENTS: MIN_ELEMENTS, MAX_ELEMENTS: MAX_ELEMENTS, MAX_SHIFT: MAX_SHIFT,
              MAX_TURN: MAX_TURN, shift: shift, pattern: pattern, beam: beam, readout: readout,
              arrival: arrival, delays: delays, signal: signal, added: added, shown: shown, places: places,
              front: front, crests: crests, heard: heard, side: side, told: told, held: held };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    root.RerArray = api;
  }
})(typeof self !== "undefined" ? self : this);
