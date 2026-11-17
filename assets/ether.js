/* Two real recordings of the air, as figure 2.5 of the chapter shows them: the rows of the spectrum, the moment of
   a row and the sentence under the picture. The rows come with the page as bytes written in base64 (a level of
   the spectrum is a byte: 0 is the bottom of the scale, 255 its top): this file only reads them. One file for the
   page and for the tests: node loads it as a module. The same rows stand in ether_example.py, and a test compares
   the two at every position of the slider of the page. */
(function (root) {
  "use strict";

  // The bytes of a text in base64.
  function decode(text) {
    if (typeof Buffer !== "undefined") { return new Uint8Array(Buffer.from(text, "base64")); }
    var raw = root.atob(text), out = new Uint8Array(raw.length), i;
    for (i = 0; i < raw.length; i += 1) { out[i] = raw.charCodeAt(i); }
    return out;
  }

  // The row k of the spectrum: `bins` levels.
  function row(bytes, bins, k) {
    return bytes.subarray(k * bins, (k + 1) * bins);
  }

  // The moment of the row k as the page prints it, in the unit of the recording.
  function momentText(record, k) {
    return (record.times[k] / record.scale).toFixed(record.digits).replace(".", ",");
  }

  // The sentence under the picture.
  function told(record, k, words) {
    var w = words.moment;
    return w[0] + momentText(record, k) + w[1] + record.unit + w[2] + (record.flags[k] ? record.on : record.off);
  }

  var api = { decode: decode, row: row, momentText: momentText, told: told };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    root.RerEther = api;
  }
})(typeof self !== "undefined" ? self : this);
