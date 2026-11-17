/* A radio wave over the ruler of figure 2.1 (б) of the chapter, as topic 2 counts it: the wavelength by the rule
   of the topic (300 divided by the frequency in megahertz gives metres), the kind of the waves by the scale of
   figure 2.2 and the users of that figure that work at the frequency. One file for the page and for the tests:
   node loads it as a module. The same computations stand in wave_example.py, and a test compares the two at
   every position of the slider of the page. */
(function (root) {
  "use strict";

  // The wavelength of the frequency f (hertz), metres. `rule` is the rule of the topic as a speed, metres times hertz.
  function wavelength(f, rule) {
    return rule / f;
  }

  // A length as the page prints it: metres from one metre on, centimetres below, at most one digit after the
  // comma and no zero at the end («3 м», «1,5 м», «67 см», «12,5 см»).
  function lengthText(metres) {
    var inMetres = metres >= 0.995, value = inMetres ? metres : metres * 100;
    var text = value.toFixed(inMetres || value < 20 ? 1 : 0);
    if (text.indexOf(".") >= 0) { text = text.replace(/0+$/, "").replace(/\.$/, ""); }
    return text.replace(".", ",") + (inMetres ? " м" : " см");
  }

  // The name of the waves of the frequency f. `names` are the names of the tenfold steps of the scale that
  // starts at `scaleFrom` hertz. A band runs from 0,3·10^N Hz (not included) to 3·10^N Hz (included), so
  // 300 MHz is still a metre wave.
  function kind(f, scaleFrom, names) {
    var step = Math.ceil(Math.log10(f / scaleFrom) - 1e-9) - 1;
    return names[Math.max(0, Math.min(step, names.length - 1))];
  }

  // The users that work at the frequency f: each has a name and either a band from `low` to `high` or, when
  // `single` is set, the two single frequencies `low` and `high`.
  function users(f, bands) {
    return bands.filter(function (b) {
      return b.single ? (f === b.low || f === b.high) : (f >= b.low && f <= b.high);
    }).map(function (b) { return b.name; });
  }

  // The sentence under the picture. `d` is what the page carries: the rule, the scale, the bands and the words.
  function told(f, d) {
    var w = d.words.told, who = users(f, d.bands);
    return w[0] + (f / 1e6).toFixed(0) + w[1] + lengthText(wavelength(f, d.rule_m_hz)) + w[2] +
           kind(f, d.scale_from_hz, d.kinds) + w[3] + (who.length ? who.join(", ") : d.words.nobody) + w[4];
  }

  // The height of the wave (from -1 to 1) at count + 1 points of the ruler, from its zero to its end.
  function heights(f, rule, ruler, count) {
    var out = [], length = wavelength(f, rule), k;
    for (k = 0; k <= count; k += 1) {
      out.push(Math.sin(2 * Math.PI * (ruler * k / count) / length));
    }
    return out;
  }

  var api = { wavelength: wavelength, lengthText: lengthText, kind: kind, users: users, told: told, heights: heights };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    root.RerWave = api;
  }
})(typeof self !== "undefined" ? self : this);
