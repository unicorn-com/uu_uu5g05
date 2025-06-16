import Tools from "../_internal/tools.js";
import LoggerFactory from "../utils/logger-factory.js";
import Config from "../config/config.js";

const ERRORS = {
  unsupportedNestingLevel: 'Nesting level "%s" is not a supported value. Use one of: %s.',
};

let logger;
function getLogger() {
  if (!logger) logger = LoggerFactory.get(Config.TAG + "Utils.NestingLevel");
  return logger;
}

// TODO Next major - remove (or move to uu5g04 only).
const BACK_COMPAT_MAP = {
  spa: "uve",
  page: "route",
  bigBoxCollection: "areaCollection",
  bigBox: "area",
  smallBoxCollection: "spotCollection",
  smallBox: "spot",
};
const BACK_COMPAT_MAP_INVERTED = Object.entries(BACK_COMPAT_MAP).reduce((r, [k, v]) => ((r[v] = k), r), {});
const DEPRECATED_VALUES = Object.keys(BACK_COMPAT_MAP);

const VALUE_LIST = [
  "uve",
  "route",
  "areaCollection",
  "area",
  "boxCollection",
  "box",
  "spotCollection",
  "spot",
  "inline",
];
const MAX_DEFAULT_NESTING_LEVEL_INDEX = VALUE_LIST.indexOf("areaCollection");

function _normalizeLevel(level) {
  return BACK_COMPAT_MAP[level] ?? level;
}
function _denormalizeLevel(level) {
  return BACK_COMPAT_MAP_INVERTED[level] ?? level;
}
function _getNestingLevelAsArray(declaredNestingLevel) {
  let result;
  if (declaredNestingLevel && !Array.isArray(declaredNestingLevel)) {
    result = [declaredNestingLevel];
  } else if (!declaredNestingLevel) {
    result = NestingLevel.valueList;
  } else {
    result = declaredNestingLevel;
  }
  return result;
}

const NestingLevel = {
  valueList: VALUE_LIST,

  // uu5g04 needs these 2 "private" methods
  _normalizeLevel,
  _denormalizeLevel,

  buildList(levelFrom, levelTo) {
    let normalizedLevelFrom = _normalizeLevel(levelFrom);
    let normalizedLevelTo = _normalizeLevel(levelTo);
    let begin = NestingLevel.valueList.indexOf(normalizedLevelFrom);
    if (process.env.NODE_ENV !== "production" && begin === -1 && normalizedLevelFrom != null) {
      Tools.warning(
        `Invalid nesting level '${levelFrom}' used in NestingLevel.buildList(...). Valid values: ${NestingLevel.valueList}`,
      );
    }
    begin < 0 && (begin = 0);
    let end = NestingLevel.valueList.indexOf(normalizedLevelTo) + 1;
    if (process.env.NODE_ENV !== "production" && end === 0 && normalizedLevelTo != null) {
      Tools.warning(
        `Invalid nesting level '${levelTo}' used in NestingLevel.buildList(...). Valid values: ${NestingLevel.valueList}`,
      );
    }
    end <= begin && (end = NestingLevel.valueList.length);
    let result = NestingLevel.valueList.slice(begin, end);
    // if building with deprecated levels such as "bigBoxCollection" then return array with those (instead of "areaCollection", etc.)
    if (normalizedLevelFrom !== levelFrom || normalizedLevelTo !== levelTo) {
      result = result.map((it) => _denormalizeLevel(it));
    }
    return result;
  },

  getNestingLevel({ nestingLevel: requestedNestingLevel }, statics) {
    let { nestingLevel: nestingLevelList } = statics;
    nestingLevelList = _getNestingLevelAsArray(nestingLevelList);

    let actualValidNestingLevel;
    // compute actual valid nesting level from requested nesting level
    let normalizedRequestedNestingLevel = _normalizeLevel(requestedNestingLevel);
    let index = normalizedRequestedNestingLevel
      ? NestingLevel.valueList.indexOf(normalizedRequestedNestingLevel)
      : MAX_DEFAULT_NESTING_LEVEL_INDEX;
    if (index === -1) {
      logNestingLevelError("unsupportedNestingLevel", [requestedNestingLevel, JSON.stringify(nestingLevelList)]);
      index = MAX_DEFAULT_NESTING_LEVEL_INDEX;
    }
    let usableIndices = nestingLevelList
      .map((it) => {
        let index = NestingLevel.valueList.indexOf(_normalizeLevel(it));
        if (index === -1) {
          let uu5Tag = statics.uu5Tag || statics.displayName;
          getLogger().error(
            `Invalid nestingLevel value in component statics: ${it}${uu5Tag ? ` (in ${uu5Tag})` : ""}. Supported values: ${NestingLevel.valueList.join(", ")}`,
          );
        }
        return index;
      })
      .filter((v) => v >= index);
    if (usableIndices.length === 0) {
      actualValidNestingLevel = null;
      // NOTE Disabled warnings. See nesting-level-mixin.js, checkNestingLevel().
      // logNestingLevelError("incorrectRequestedNestingLevel", [
      //   statics.displayName,
      //   requestedNestingLevel,
      //   JSON.stringify(nestingLevelList)
      // ]);
    } else {
      actualValidNestingLevel = NestingLevel.valueList[Math.min(...usableIndices)];
    }

    // for backward compatibility - if component uses legacy nesting levels in their "nestingLevelList"
    // then return legacy level, otherwise return normalized level
    let result = nestingLevelList.some((it) => _normalizeLevel(it) !== it)
      ? _denormalizeLevel(actualValidNestingLevel)
      : actualValidNestingLevel;
    return result;
  },

  getChildNestingLevel(props, statics) {
    let childNestingLevel;

    let actualValidNestingLevel = NestingLevel.getNestingLevel(props, statics);
    if (actualValidNestingLevel) {
      let index = NestingLevel.valueList.indexOf(_normalizeLevel(actualValidNestingLevel));
      if (!/Collection$/.test(actualValidNestingLevel)) index = Math.min(index + 1, NestingLevel.valueList.length - 1);
      childNestingLevel = NestingLevel.valueList[index]; // return always normalized level
    }
    // for backward compatibility - if component uses legacy nesting levels in their "nestingLevelList"
    // then return legacy level, otherwise return normalized level
    let nestingLevelList = _getNestingLevelAsArray(statics.nestingLevel);
    let result = nestingLevelList.some((it) => _normalizeLevel(it) !== it)
      ? _denormalizeLevel(childNestingLevel)
      : childNestingLevel;
    return result;
  },

  compare(nestingLevel1, nestingLevel2) {
    // empty / invalid nesting levels are handled as "inline"
    let index1 = NestingLevel.valueList.indexOf(_normalizeLevel(nestingLevel1));
    let index2 = NestingLevel.valueList.indexOf(_normalizeLevel(nestingLevel2));
    if (index1 === -1) index1 = NestingLevel.valueList.length - 1;
    if (index2 === -1) index2 = NestingLevel.valueList.length - 1;
    return index1 - index2;
  },
};

function logNestingLevelError(mixinErrorCode, params) {
  let message = ERRORS[mixinErrorCode];
  let formattedMessage = Tools.formatString(message, params);
  Tools.error(formattedMessage);
}

// function getComponentName(component) {
//   return (
//     (component
//       ? typeof component.getTagName === "function"
//         ? component.getTagName()
//         : component.constructor && component.constructor.displayName
//       : "") || ""
//   );
// }

export { NestingLevel, DEPRECATED_VALUES };
export default NestingLevel;
