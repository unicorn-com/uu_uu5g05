import { Utils } from "uu5g05";

function getAlpha(rgba) {
  let [_, r, g, b, alpha] = rgba.split(/[^0-9.]+/);
  return alpha;
}

function getColorModels(value) {
  if (!value || typeof value !== "string") return;
  let opacity = 1;
  let hex = Utils.Color.toHex(value);
  let rgba = Utils.Color.toRgba(value);

  if (/^rgba?/.test(value)) {
    opacity = getAlpha(value);
  }

  hex = hex?.toUpperCase();
  opacity = Math.round(opacity * 100);
  rgba = `rgba(${rgba.join(", ")})`;

  return { rgba, hex, opacity };
}

export { getAlpha, getColorModels };
