/**
 * Copyright (C) 2021 Unicorn a.s.
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public
 * License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later
 * version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License at
 * <https://gnu.org/licenses/> for more details.
 *
 * You may obtain additional information at <https://unicorn.com> or contact Unicorn a.s. at address: V Kapslovne 2767/2,
 * Praha 3, Czech Republic or at the email: info@unicorn.com.
 */

let canvasContext;

const Color = {
  toRgba(cssColor) {
    let normalized = normalize(cssColor);
    let result;
    if (normalized.startsWith("#")) {
      result = hexToRgba(normalized);
    } else {
      result = normalized
        .split(/[^0-9.]+/)
        .slice(1, 5)
        .map(Number);
    }
    return result;
  },
  toHex(cssColor, preserveAlpha = false) {
    let result = normalize(cssColor);
    if (!result.startsWith("#")) {
      let [_, r, g, b, a] = result.split(/[^0-9.]+/);
      result =
        "#" +
        Number(r).toString(16).padStart(2, "0") +
        Number(g).toString(16).padStart(2, "0") +
        Number(b).toString(16).padStart(2, "0") +
        (preserveAlpha
          ? Math.round(Number(a) * 255)
              .toString(16)
              .padStart(2, "0")
          : "");
    }
    return result;
  },
  isLight(cssColor) {
    let [r, g, b] = Color.toRgba(cssColor);

    // Counting the perceptive luminance
    // human eye favors green color...
    let a = 1 - (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return a < 0.5;
  },
};

// returns "#aabbcc" or "rgba(a, b, c, 0.x)" - https://html.spec.whatwg.org/multipage/canvas.html#serialisation-of-a-color
// accepts any valid color (name, hsl, hsla, rgb, rgba, hex)
function normalize(cssColor) {
  // in Jest tests usually there is no "canvas" package installed => use simplifid normalization
  if (process.env.NODE_ENV === "test") {
    let el = document.createElement("div");
    el.style.color = cssColor;
    let result = el.style.color; // "computed value" as per https://www.w3.org/TR/css-color-3/#foreground
    if (result === "transparent") result = "rgba(0, 0, 0, 0)";
    let match;
    if ((match = el.style.color.match(/^rgb\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/))) {
      result =
        "#" +
        Number(match[1]).toString(16).padStart(2, "0") +
        Number(match[2]).toString(16).padStart(2, "0") +
        Number(match[3]).toString(16).padStart(2, "0");
    }
    return result;
  }
  if (!canvasContext) canvasContext = document.createElement("canvas").getContext("2d");
  canvasContext.fillStyle = "#000";
  canvasContext.fillStyle = cssColor; // browser performs normalization
  return canvasContext.fillStyle;
}

function hexToRgba(hex) {
  let result = /^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(hex);

  let r = parseInt(result[1], 16);
  let g = parseInt(result[2], 16);
  let b = parseInt(result[3], 16);
  let a = parseInt(result[4] || "ff", 16);

  return [r, g, b, a / 255];
}

export { Color };
export default Color;
