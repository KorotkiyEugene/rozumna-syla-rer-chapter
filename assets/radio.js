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

  // The answer of the calculator: power of the transmitter in milliwatts, frequency in megahertz, distance in metres.
  // Nearer than one wavelength the equation is not used: there it stops describing what an antenna receives.
  function readout(c, pMw, fMhz, dM) {
    if (!(positive(pMw) && positive(fMhz) && positive(dM))) {
      return "Введіть три додатні числа.";
    }
    var f = fMhz * MEGAHERTZ, lam = wavelength(c, f);
    var head = "Довжина хвилі " + length(lam) + ". ";
    if (dM < lam) {
      return head + "Відстань менша за довжину хвилі: так близько до антени рівняння Фрііса не діє.";
    }
    var p = received(c, pMw * MILLIWATT, f, dM);
    return head + "Антена приймає " + power(p) + ", тобто " + level(p) + ".";
  }

  // The rows of the table under the calculator: [distance, received power, level] at the distance itself,
  // twice as far and ten times as far. No rows when readout() gives no power.
  function rows(c, pMw, fMhz, dM) {
    if (!(positive(pMw) && positive(fMhz) && positive(dM))) {
      return [];
    }
    var f = fMhz * MEGAHERTZ;
    if (dM < wavelength(c, f)) {
      return [];
    }
    return FURTHER.map(function (k) {
      var p = received(c, pMw * MILLIWATT, f, dM * k);
      return [plain(dM * k) + " м", power(p), level(p)];
    });
  }

  var api = { wavelength: wavelength, received: received, dbm: dbm, power: power, length: length, level: level,
              plain: plain, readout: readout, rows: rows };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    root.RerRadio = api;
  }
})(typeof self !== "undefined" ? self : this);
