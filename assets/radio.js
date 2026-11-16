/* Radio formulas of the site: the wavelength, the equation of Friis, the level in decibels, and the way
   a power or a length is printed. One file for the pages and for the tests: node loads it as a module.
   The speed of light is never typed here: a page passes the speed with which its topic counts. The page of
   topic 2 passes the speed of the rule of the chapter («300 ділять на частоту в мегагерцах»), 3·10⁸ m/s, so that
   the calculator and a student who counts by hand get one number. */
(function (root) {
  "use strict";

  var MILLIWATT = 1e-3;            // watts in one milliwatt: a level in dBm is counted from this power
  var MEGAHERTZ = 1e6;             // hertz in one megahertz
  var MINUS = "−";
  var FURTHER = [1, 2, 10];        // the table of the calculator: the distance itself, twice as far, ten times as far
  var POWER = [[1e6, "МВт"], [1e3, "кВт"], [1, "Вт"], [1e-3, "мВт"], [1e-6, "мкВт"], [1e-9, "нВт"],
               [1e-12, "пВт"], [1e-15, "фВт"]];
  var LENGTH = [[1e3, "км"], [1, "м"], [1e-2, "см"], [1e-3, "мм"]];
  var AREA = [[1e6, "км²"], [1, "м²"], [1e-4, "см²"], [1e-6, "мм²"]];
  var GAP = "\u00a0";              // between the groups of three digits of a long number: it stays on one line
  var PAPER = 1.4;                 // the paper of the picture: one wavelength takes from 1,4 to 14 of its squares
  var FAR = 1e12;                  // from this number on a ratio of two areas is printed as «5,90 · 10¹⁴»
  var RAISED = { "-": "⁻", "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷",
                 "8": "⁸", "9": "⁹" };

  // Wavelength in metres: c is the speed of light in metres per second, f the frequency in hertz.
  function wavelength(c, f) {
    return c / f;
  }

  // The equation of Friis for two antennas that work equally in every direction, with nothing in the way:
  // the power in watts that an antenna receives at d metres from a transmitter of p watts.
  function received(c, p, f, d) {
    var share = wavelength(c, f) / (4 * Math.PI * d);
    return p * share * share;
  }

  // The area in square metres of a sphere of the radius d metres: over it the power of a transmitter that works
  // equally in every direction is spread at the distance d.
  function sphere(d) {
    return 4 * Math.PI * d * d;
  }

  // The area in square metres of the patch of that sphere through which passes as much power as an antenna
  // receives, when the antenna works equally in every direction («effective area of an isotropic antenna»).
  // The share of the patch in the sphere is the factor of the equation of Friis: received = p · patch / sphere.
  function patch(c, f) {
    var lam = wavelength(c, f);
    return lam * lam / (4 * Math.PI);
  }

  // Level of a power of p watts, in decibels above one milliwatt.
  function dbm(p) {
    return 10 * Math.log10(p / MILLIWATT);
  }

  // A number that is already rounded to three significant digits, printed with exactly those digits.
  function three(x) {
    var digits = x >= 99.9995 ? 0 : x >= 9.99995 ? 1 : 2;
    return x.toFixed(digits).replace(".", ",");
  }

  // Three significant digits with the largest unit of the list that leaves the number at least 1.
  function withUnit(value, units) {
    var r = Number(value.toPrecision(3)), i;
    for (i = 0; i < units.length - 1; i += 1) {
      if (r >= units[i][0]) { break; }
    }
    return three(r / units[i][0]) + " " + units[i][1];
  }

  // 5.7e-28 -> «5,70 · 10⁻²⁸»: for a power that no prefix of the list reaches.
  function science(x) {
    var parts = x.toExponential(2).split("e");
    var exponent = parts[1].replace("+", "").split("").map(function (ch) { return RAISED[ch]; }).join("");
    return parts[0].replace(".", ",") + " · 10" + exponent;
  }

  // A number with n significant digits: «314,2», «12,43», «0,07958», and «31 420» with a gap between the groups
  // of three digits before the comma.
  function digits(x, n) {
    var r = Number(x.toPrecision(n));
    if (r < 1) {
      return r.toPrecision(n).replace(".", ",");
    }
    var parts = r.toFixed(Math.max(0, n - String(Math.floor(r)).length)).split(".");
    var whole = parts[0].length > 3 ? parts[0].replace(/\B(?=(\d{3})+$)/g, GAP) : parts[0];
    return whole + (parts.length > 1 ? "," + parts[1] : "");
  }

  function four(x) {
    return digits(x, 4);
  }

  // An area in square metres as the page prints it: «314,2 м²», «12,43 см²». One digit more than a power has,
  // so that a reader who divides the printed numbers gets the printed power.
  function area(a) {
    var r = Number(a.toPrecision(4)), i;
    for (i = 0; i < AREA.length - 1; i += 1) {
      if (r >= AREA[i][0]) { break; }
    }
    if (r / AREA[i][0] >= 1e9 || r / AREA[i][0] < 1e-3) {
      return science(a) + " м²";
    }
    return four(r / AREA[i][0]) + " " + AREA[i][1];
  }

  // How many times one area is larger than another: «252 700», and «4,39 · 10¹⁴» from a million millions on.
  function ratio(x) {
    return Number(x.toPrecision(4)) >= FAR ? science(x) : four(x);
  }

  // The division that the sentence of the calculator prints, «100 мВт : 252 700 = 396 нВт»: the ratio with as
  // many digits, from four to seven, as make the printed numbers give the printed power when a reader divides
  // them. `exact` is false when no such ratio exists: the sentence then says «≈». Powers in watts.
  function division(emitted, times, got) {
    var from = Number(emitted.toPrecision(3)), n;
    if (Number(times.toPrecision(4)) >= FAR) {
      return { ratio: science(times), exact: power(from / Number(times.toPrecision(3))) === power(got) };
    }
    for (n = 4; n <= 7; n += 1) {
      if (power(from / Number(times.toPrecision(n))) === power(got)) {
        return { ratio: digits(times, n), exact: true };
      }
    }
    return { ratio: four(times), exact: false };
  }

  // A power in watts as the page prints it: «395 нВт», «25,0 Вт».
  function power(p) {
    var r = Number(p.toPrecision(3));
    if (r >= 1000 * POWER[0][0] || r < POWER[POWER.length - 1][0]) {
      return science(p) + " Вт";
    }
    return withUnit(p, POWER);
  }

  // A length in metres as the page prints it: «12,5 см», «2,19 м».
  function length(l) {
    return withUnit(l, LENGTH);
  }

  // The level of a power in whole decibels above one milliwatt: «−34 дБм».
  function level(p) {
    var n = Math.floor(dbm(p) + 0.5);
    return (n < 0 ? MINUS + String(-n) : String(n)) + " дБм";
  }

  // A number without needless zeros and with a decimal comma: 5, 2,5, 0,125.
  function plain(x) {
    return x.toFixed(3).replace(/\.?0+$/, "").replace(".", ",");
  }

  function positive(x) {
    return typeof x === "number" && isFinite(x) && x > 0;
  }

  // The side of a square of the paper as the picture names it: «1 см», «10 см», «1 м».
  function square(u) {
    var i;
    for (i = 0; i < LENGTH.length - 1; i += 1) {
      if (u >= LENGTH[i][0] * 0.999) { break; }
    }
    var n = u / LENGTH[i][0];
    return (n < 1e-3 ? science(n) : plain(Number(n.toPrecision(3)))) + " " + LENGTH[i][1];
  }

  // What the picture of the calculator shows: the words of its labels and, for the paper on which the patch is
  // drawn, the wavelength and the side of the patch in squares of the paper. A square is 1 mm, 1 cm, 10 cm, 1 m and
  // so on: the size with which one wavelength takes from 1,4 to 14 squares. Null when readout() gives no power.
  function link(c, pMw, fMhz, dM) {
    if (!(positive(pMw) && positive(fMhz) && positive(dM))) {
      return null;
    }
    var f = fMhz * MEGAHERTZ, lam = wavelength(c, f);
    if (dM < lam) {
      return null;
    }
    var p = received(c, pMw * MILLIWATT, f, dM), side = Math.sqrt(patch(c, f));
    var unit = Math.pow(10, Math.floor(Math.log10(lam / PAPER)));
    var divided = division(pMw * MILLIWATT, sphere(dM) / patch(c, f), p);
    // the distance as it was typed while it is short, else with three digits: the label of the picture stays short
    var radius = plain(dM).length <= 6 ? plain(dM) + " м" : length(dM);
    return { radius: radius, sphere: area(sphere(dM)), wave: length(lam), patch: area(patch(c, f)),
             side: length(side), square: square(unit), ratio: divided.ratio, exact: divided.exact,
             emitted: power(pMw * MILLIWATT), received: power(p), level: level(p),
             paper: { wave: lam / unit, side: side / unit } };
  }

  // The answer of the calculator: power of the transmitter in milliwatts, frequency in megahertz, distance in metres.
  // Nearer than one wavelength the equation is not used: there it stops describing what an antenna receives.
  function readout(c, pMw, fMhz, dM) {
    if (!(positive(pMw) && positive(fMhz) && positive(dM))) {
      return "Введіть три додатні числа.";
    }
    var shown = link(c, pMw, fMhz, dM);
    if (!shown) {
      return "Довжина хвилі " + length(wavelength(c, fMhz * MEGAHERTZ)) + ". Відстань менша за довжину хвилі: " +
             "так близько до антени рівняння Фрііса не діє.";
    }
    // a ratio written as «4,39 · 10¹⁴» stands in brackets after the sign of division
    var by = shown.ratio.indexOf("·") < 0 ? shown.ratio : "(" + shown.ratio + ")";
    return "Площа сфери, поділена на площу клаптика: приблизно " + shown.ratio + ". Антена приймає " +
           shown.emitted + GAP + ": " + by + GAP + (shown.exact ? "= " : "≈ ") + shown.received + ", або " +
           shown.level + ".";                       // a sign of the division never begins a line
  }

  // The rows of the table under the calculator: [distance, area of the sphere, received power, level] at the
  // distance itself, twice as far and ten times as far. No rows when readout() gives no power.
  function rows(c, pMw, fMhz, dM) {
    if (!link(c, pMw, fMhz, dM)) {
      return [];
    }
    var f = fMhz * MEGAHERTZ;
    return FURTHER.map(function (k) {
      var p = received(c, pMw * MILLIWATT, f, dM * k);
      return [plain(dM * k) + " м", area(sphere(dM * k)), power(p), level(p)];
    });
  }

  var api = { wavelength: wavelength, received: received, sphere: sphere, patch: patch, dbm: dbm, power: power,
              length: length, area: area, ratio: ratio, level: level, plain: plain, link: link, readout: readout,
              rows: rows };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    root.RerRadio = api;
  }
})(typeof self !== "undefined" ? self : this);
