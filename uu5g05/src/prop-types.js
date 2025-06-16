import PropTypes from "prop-types";

// NOTE Not using PropTypes.exact() as it tries to JSON.stringify() extra props which throws on some JSX values due to containing
// cyclic references which then makes figuring out the real issue hard to find out.
const lsiLazy = PropTypes.shape({
  import: PropTypes.func.isRequired,
  path: PropTypes.arrayOf(PropTypes.string),
  params: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
});

const lsiObject = PropTypes.objectOf(PropTypes.string);

const lsi = PropTypes.oneOfType([PropTypes.string, lsiObject, lsiLazy]);

// { import, path }
// { key: lsi } => lsi: { cs, en, ... } || { import, path }
const lsiMap = PropTypes.oneOfType([
  lsiLazy,
  function (props, propName, componentName) {
    if (props[propName] != null) {
      if (typeof props[propName] === "object" && !props[propName].import) {
        for (let k in props[propName]) {
          PropTypes.checkPropTypes(
            { [k]: PropTypes.oneOfType([lsiLazy, lsiObject]) },
            props[propName],
            `prop ${propName}`,
            componentName,
          );
        }
      } else {
        const err = new Error(
          "Invalid prop `" + propName + "` supplied to" + " `" + componentName + "`. Validation failed.",
        );
        err.data = { expectedType: "lsiObjectMap" };
        return err;
      }
    }
  },
]);

const unit = PropTypes.oneOfType([PropTypes.string, PropTypes.number]);
const space = PropTypes.oneOfType([
  unit,
  PropTypes.shape({
    top: unit,
    right: unit,
    bottom: unit,
    left: unit,
  }),
]);

const borderRadius = PropTypes.oneOf(["none", "elementary", "moderate", "expressive", "full"]);

const icon = PropTypes.oneOfType([PropTypes.string, PropTypes.element]);

const dataObject = PropTypes.shape({
  data: PropTypes.any,
  state: PropTypes.oneOfType([
    PropTypes.oneOf(["ready", "readyNoData", "pending", "pendingNoData", "error", "errorNoData"]),
    PropTypes.string, // string is included because dataObject from useDataList can set "itemPending" which would cause warnings if passed to e.g. Plus4U5Elements.DataStateResolver with this propType
  ]),
  errorData: PropTypes.shape({
    error: PropTypes.any,
    operation: PropTypes.string,
    dtoIn: PropTypes.any,
    data: PropTypes.any,
  }),
  pendingData: PropTypes.shape({
    operation: PropTypes.string,
    dtoIn: PropTypes.any,
  }),
  handlerMap: PropTypes.objectOf(PropTypes.func),
});

// prettier-ignore
const COLOR_SCHEME = {
  building: ["building"],
  meaning: ["primary", "secondary", "dim", "neutral", "important", "positive", "warning", "negative"],
  basic: [
    "dark-blue", "blue", "light-blue", "cyan", "dark-green", "green", "light-green", "yellow", "orange",
    "red", "pink", "purple", "dark-purple", "brown", "grey", "steel"
  ],
  state: ["system", "initial", "active", "final", "alternative-active", "problem", "passive", "alternative-final", "cancelled"],
  priority: ["highest", "high", "normal", "low", "objective", "problem"],
};

const COLOR_SCHEME_LIST = [].concat(...Object.values(COLOR_SCHEME)).filter((v, i, arr) => arr.indexOf(v) === i);

function isRequiredIf(propType, isRequired) {
  return function (props) {
    const test = isRequired(...arguments) ? propType.isRequired : propType;
    return test.apply(this, arguments);
  };
}

function isDeprecated(propType, newPropName) {
  return function (props, propName, componentName) {
    if (props[propName] != null) {
      const err = new Error(
        `Property \`${propName}\` is deprecated.` + (newPropName ? ` Use property \`${newPropName}\` instead.` : ""),
      );
      err.data = {};
      return err;
    } else {
      return propType.apply(this, arguments);
    }
  };
}

function colorScheme(...categories) {
  if (categories[0] && typeof categories[0] === "object") {
    const [props, propName, componentName] = categories;

    if (props[propName] !== undefined && COLOR_SCHEME_LIST.indexOf(props[propName]) < 0) {
      // prettier-ignore
      const err = new Error(
        "Invalid prop `" + propName + "` of value `" + props[propName] + "` supplied to `" + componentName +
        "`, expected one of " + JSON.stringify(COLOR_SCHEME_LIST) + "."
      );
      err.data = { expectedType: "colorScheme" };
      return err;
    }
  } else if (!categories.length) {
    const err = new Error(
      "Invalid prop `colorScheme` without parameters. Use just PropTypes.colorScheme or " +
        'e.g. PropTypes.colorScheme("meaning", "basic")',
    );
    err.data = { expectedType: "colorScheme" };
    return err;
  } else {
    const values = [].concat(
      ...Object.keys(COLOR_SCHEME)
        .filter((k) => categories.indexOf(k) > -1)
        .map((k) => COLOR_SCHEME[k]),
    );

    return PropTypes.oneOf(values);
  }
}

const background = PropTypes.oneOf(["light", "dark", "soft", "full"]);

const sizeOf = (valueType) =>
  PropTypes.oneOfType([
    valueType,
    PropTypes.exact({ xs: valueType, s: valueType, m: valueType, l: valueType, xl: valueType }),
  ]);

export * from "prop-types";
export {
  isRequiredIf,
  isDeprecated,
  sizeOf,
  background,
  borderRadius,
  icon,
  colorScheme,
  lsi,
  lsiMap,
  space,
  unit,
  dataObject,
  COLOR_SCHEME,
  COLOR_SCHEME_LIST,
};

export default {
  ...PropTypes,
  isRequiredIf,
  isDeprecated,
  sizeOf,
  background,
  borderRadius,
  icon,
  colorScheme,
  lsi,
  lsiMap,
  space,
  unit,
  dataObject,
  COLOR_SCHEME,
  COLOR_SCHEME_LIST,
};
