import Tools from "../_internal/tools.js";
import ScreenSize from "./screen-size.js";

const { XS, S, M, L } = ScreenSize;

const SIZE_LIST = Object.keys(ScreenSize._SIZE_MAP);

function getSpaceStyle(value, name) {
  const spaceStyle = {};
  if (typeof value === "object") {
    for (let key in value) spaceStyle[`${name}${key.charAt(0).toUpperCase() + key.slice(1)}`] = value[key];
  } else {
    spaceStyle[name] = value;
  }
  return spaceStyle;
}

export const Style = {
  parse(styleString) {
    let obj = {};
    let properties = styleString.split(";");

    properties.forEach((item) => {
      let keysAndValues = item.split(":");
      if (keysAndValues.length > 1) {
        obj[Tools.getCamelCase(keysAndValues[0].trim(), true)] = keysAndValues[1].trim();
      }
    });

    return obj;
  },

  parseSpace(value, name) {
    let style;

    if (value != null && value !== "") {
      style = {};

      if (typeof value === "object") {
        if (Object.keys(value).find((size) => SIZE_LIST.includes(size))) {
          SIZE_LIST.forEach((size) => {
            if (value[size]) {
              const spaceStyle = getSpaceStyle(value[size], name);
              style = { ...style, ...Style.getMinMediaQueries(size, spaceStyle) };
            }
          });
        } else {
          style = getSpaceStyle(value, name);
        }
      } else {
        style[name] = value;
      }
    }

    return style;
  },

  getMediaQueries(screenSize, styles) {
    let key;

    switch (screenSize.toLowerCase()) {
      case "xs":
        key = `@media screen and (max-width: ${XS}px)`;
        break;
      case "s":
        key = `@media screen and (min-width: ${XS + 1}px) and (max-width: ${S}px)`;
        break;
      case "m":
        key = `@media screen and (min-width: ${S + 1}px) and (max-width: ${M}px)`;
        break;
      case "l":
        key = `@media screen and (min-width: ${M + 1}px) and (max-width: ${L}px)`;
        break;
      case "xl":
        key = `@media screen and (min-width: ${L + 1}px)`;
        break;
    }

    return typeof styles === "string" ? `${key} {${styles}}` : { [key]: styles };
  },

  getMinMediaQueries(screenSize, styles) {
    let key;

    switch (screenSize.toLowerCase()) {
      case "s":
        key = `@media screen and (min-width: ${XS + 1}px)`;
        break;
      case "m":
        key = `@media screen and (min-width: ${S + 1}px)`;
        break;
      case "l":
        key = `@media screen and (min-width: ${M + 1}px)`;
        break;
      case "xl":
        key = `@media screen and (min-width: ${L + 1}px)`;
        break;
    }

    return screenSize === "xs" ? styles : typeof styles === "string" ? `${key} {${styles}}` : { [key]: styles };
  },

  getMaxMediaQueries(screenSize, styles) {
    let key;

    switch (screenSize.toLowerCase()) {
      case "xs":
        key = `@media screen and (max-width: ${XS}px)`;
        break;
      case "s":
        key = `@media screen and (max-width: ${S}px)`;
        break;
      case "m":
        key = `@media screen and (max-width: ${M}px)`;
        break;
      case "l":
        key = `@media screen and (max-width: ${L}px)`;
        break;
    }

    return screenSize === "xl" ? styles : typeof styles === "string" ? `${key} {${styles}}` : { [key]: styles };
  },

  replaceAdaptiveSpacing(value, spacing) {
    let result = value;

    if (typeof value === "object") {
      let validValue = {};
      for (let key in value) {
        validValue[key] = Style.replaceAdaptiveSpacing(value[key], spacing);
      }
      result = validValue;
    } else if (typeof value === "string") {
      let convertedValue = ScreenSize.convertStringToObject(value);
      if (typeof convertedValue === "object") {
        // from string (e.g. "xs: 5px; m: 5px 10px 8px 12px") to the object with screen sizes
        let validValue = Style.replaceAdaptiveSpacing(convertedValue, spacing);
        result = ScreenSize.convertObjectToString(validValue);
      } else {
        let valueParts = convertedValue.split(" ");
        let text;
        for (let value of valueParts) {
          let prevValue = text ? text + " " : "";
          let newValue = value;
          if (["a", "b", "c", "d"].some((adaptiveValue) => adaptiveValue === value)) {
            // replace adaptive value with valid value for css
            newValue = spacing[value] + "px";
          }
          text = prevValue + newValue;
        }
        result = text;
      }
    }
    return result;
  },
};

export default Style;
