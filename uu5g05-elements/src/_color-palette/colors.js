import UuGds from "../_internal/gds.js";

let INITIALIZED = false;

let COLOR_MAP;
let COLOR_SCHEME_MAP;
let COLOR_SWATCHES;
let FIXED_COLOR_MAP;
let FIXED_COLOR_SCHEME_MAP;
let FIXED_COLOR_SWATCHES;

function initColors() {
  COLOR_SWATCHES = UuGds.getValue(["ColorSwatches", "unicorn"]);
  COLOR_MAP = {};
  COLOR_SCHEME_MAP = {};

  Object.entries(COLOR_SWATCHES).forEach(([colorName, swatchColorMap]) => {
    Object.keys(swatchColorMap).forEach((shade) => {
      let color = swatchColorMap[shade];
      COLOR_MAP[color] = { colorScheme: colorName, shade };
    });

    COLOR_SCHEME_MAP[colorName] = { mainColor: swatchColorMap["c500"], shadeMap: swatchColorMap };
  });

  // There is needed to fix some colors from uuGds to be compatible with UX design
  // Combine light-grey and dark-grey into grey as it is in the UX design
  const lightGrey = COLOR_SCHEME_MAP["light-grey"];
  const darkGrey = COLOR_SCHEME_MAP["dark-grey"];
  let greyShadeMap = {
    c50: lightGrey.shadeMap["c50"],
    c100: lightGrey.shadeMap["c200"],
    c200: lightGrey.shadeMap["c400"],
    c300: lightGrey.shadeMap["c600"],
    c500: lightGrey.shadeMap["c800"],
    c600: darkGrey.shadeMap["c50"],
    c700: darkGrey.shadeMap["c200"],
    c800: darkGrey.shadeMap["c400"],
    c950: darkGrey.shadeMap["c600"],
  };

  FIXED_COLOR_SCHEME_MAP = { ...COLOR_SCHEME_MAP };
  delete FIXED_COLOR_SCHEME_MAP["light-grey"];
  delete FIXED_COLOR_SCHEME_MAP["dark-grey"];
  FIXED_COLOR_SCHEME_MAP.grey = {
    mainColor: lightGrey.shadeMap["c800"],
    shadeMap: greyShadeMap,
  };

  FIXED_COLOR_MAP = { ...COLOR_MAP };
  Object.keys(greyShadeMap).forEach((shade) => {
    FIXED_COLOR_MAP[greyShadeMap[shade]] = { colorScheme: "grey", shade };
  });

  FIXED_COLOR_SWATCHES = { ...COLOR_SWATCHES, grey: {}, black: {}, white: {} };
  delete FIXED_COLOR_SWATCHES["light-grey"];
  delete FIXED_COLOR_SWATCHES["dark-grey"];

  // Manualy add black and white as they are not contained in swatches

  FIXED_COLOR_SCHEME_MAP.black = { mainColor: "#000000" };
  FIXED_COLOR_MAP["#000000"] = { colorScheme: "black" };

  FIXED_COLOR_SCHEME_MAP.white = { mainColor: "#FFFFFF" };
  FIXED_COLOR_MAP["#FFFFFF"] = { colorScheme: "white" };
}

function initialize() {
  INITIALIZED = true;
  initColors();
}

function getColorSwatches(fixed) {
  if (!INITIALIZED) initialize();
  return fixed ? FIXED_COLOR_SWATCHES : COLOR_SWATCHES;
}

function getColorMap(fixed) {
  if (!INITIALIZED) initialize();
  return fixed ? FIXED_COLOR_MAP : COLOR_MAP;
}

function getColorSchemeMap(fixed) {
  if (!INITIALIZED) initialize();
  return fixed ? FIXED_COLOR_SCHEME_MAP : COLOR_SCHEME_MAP;
}

export { getColorMap, getColorSchemeMap, getColorSwatches };
