import EventManager from "./event-manager.js";

const XS = 480;
const S = 768;
const M = 992;
const L = 1360;
const XL = Infinity;

const SIZE_MAP = {
  xs: XS,
  s: S,
  m: M,
  l: L,
  xl: XL,
};

const SIZE_LIST = ["xs", "s", "m", "l", "xl"];

const isSizeOfMap = (sizeOf, sizeList) => {
  return typeof sizeOf === "object" && Object.keys(sizeOf).every((size) => sizeList.includes(size));
};

// !!! Do not rename methods - _SIZE_MAP, _register. _unregister, _setSize + API methods are used by uu5g04.
const ScreenSize = {
  XS,
  S,
  M,
  L,
  XL,
  _SIZE_MAP: SIZE_MAP,
  _SIZE_LIST: SIZE_LIST,

  countSize(width = window.innerWidth) {
    let result;

    if (width <= this.XS) {
      result = "xs";
    } else if (width <= this.S) {
      result = "s";
    } else if (width <= this.M) {
      result = "m";
    } else if (width <= this.L) {
      result = "l";
    } else {
      result = "xl";
    }

    return result;
  },

  _register(listener) {
    return EventManager.register("screenSize", listener);
  },

  _unregister(listener) {
    return EventManager.unregister("screenSize", listener);
  },

  _setSize(event, screenSize) {
    if (actualScreenSize !== screenSize) {
      actualScreenSize = screenSize;
      EventManager.trigger("screenSize", event, screenSize);
    }
  },

  getSize() {
    return actualScreenSize;
  },

  parseValue(value) {
    let result;

    // parse value
    if (typeof value === "object") {
      result = value;
    } else if (typeof value === "string") {
      result = {};
      value.split(" ").forEach((item) => {
        let parts = item.match(/^([^-]+)-(.*)$/);
        if (parts) {
          result[parts[1]] = parts[2];
        }
      });
    } else {
      return { xs: value };
    }

    // filter all non screen size keys from result
    let _result = {};
    result = Object.keys(result)
      .filter((key) => SIZE_MAP[key])
      .forEach((key) => (_result[key] = result[key]));
    result = _result;

    // check if result contains some key - if not original value was only string with - and it is not screen size value
    if (!Object.keys(result).length) {
      result = { xs: value };
    }

    return result;
  },

  getSizeValue(sizeOf, size, sizeList = SIZE_LIST) {
    const sizeListReversed = [...sizeList].reverse();

    // value does not need to be wrapped inside the { xs: <...>, ... } object - if it's not, we can just return it
    if (!isSizeOfMap(sizeOf, sizeListReversed)) return sizeOf;
    return sizeOf[size] ?? sizeOf[sizeListReversed.slice(sizeListReversed.indexOf(size)).find((it) => sizeOf[it])];
  },

  convertStringToObject(text) {
    let result = text;
    let regexp = /[:;]/;
    if (typeof text === "string" && regexp.test(text)) {
      result = Object.fromEntries(
        text
          .replace(/;$/, "")
          .split(";")
          .map((screenSizeDef) =>
            screenSizeDef.split(":").map((v) => {
              v = v.trim();
              const num = +v;
              if (!isNaN(num)) v = num;
              return v;
            }),
          ),
      );
    }
    return result;
  },

  convertObjectToString(value) {
    let result = value;
    if (typeof value === "object" && !Array.isArray(value)) {
      let text;
      for (let screenSize in value) {
        let prevScreenSize = text ? text + " " : "";
        let newScreenSize = screenSize + ": " + value[screenSize] + ";";
        text = prevScreenSize + newScreenSize;
      }
      result = text;
    }
    return result;
  },
};

let actualScreenSize = ScreenSize.countSize();
const resizeFn = (e) => ScreenSize._setSize(e, ScreenSize.countSize());

window.addEventListener("resize", resizeFn);
window.addEventListener("orientationchange", resizeFn);

export { ScreenSize };
export default ScreenSize;
