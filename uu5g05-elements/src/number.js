//@@viewOn:imports
import { PropTypes, useUserPreferences, useLanguage, Utils, createVisualComponent } from "uu5g05";
import Config from "./config/config.js";
import Tools from "./_internal/tools.js";
//@@viewOff:imports

//@@viewOn:constants
//@@viewOff:constants

//@@viewOn:css
//@@viewOff:css

//@@viewOn:helpers
function expand(value) {
  if (value > 0) {
    return Math.ceil(value);
  } else {
    return Math.floor(value);
  }
}

function halfExpand(value) {
  if (value > 0) {
    return Math.round(value);
  } else {
    return -Math.round(-value);
  }
}

function halfFloor(value) {
  return -Math.round(-value);
}

function halfTrunc(value) {
  if (value < 0) {
    return Math.round(value);
  } else {
    return -Math.round(-value);
  }
}

function halfEven(value) {
  let even = Math.round(value);
  if (even % 2 === 0) {
    return even;
  } else if (even < 0) {
    return Math.floor(value) + 1;
  } else {
    return Math.ceil(value) - 1;
  }
}

function round(value, roundingPosition, roundingMode = "round") {
  let roundingFn;

  switch (roundingMode) {
    case "ceil":
      roundingFn = Math.ceil;
      break;
    case "floor":
      roundingFn = Math.floor;
      break;
    case "expand":
      roundingFn = expand;
      break;
    case "trunc":
      roundingFn = Math.trunc;
      break;
    case "halfCeil":
      roundingFn = Math.round;
      break;
    case "halfFloor":
      roundingFn = halfFloor;
      break;
    case "halfExpand":
      roundingFn = halfExpand;
      break;
    case "halfTrunc":
      roundingFn = halfTrunc;
      break;
    case "halfEven":
      roundingFn = halfEven;
      break;
    default:
      roundingFn = Math.round;
  }

  if (roundingPosition < 0) {
    let num = 10 ** -roundingPosition;
    return roundingFn(value * num) / num;
  } else if (roundingPosition > 0) {
    let num = 10 ** roundingPosition;
    return roundingFn(value / num) * num;
  } else {
    return roundingFn(value);
  }
}

//@@viewOff:helpers

const Number = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Number",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    value: PropTypes.number.isRequired,
    notation: PropTypes.oneOf(["standard", "scientific", "engineering"]),
    format: PropTypes.oneOf(["long", "short"]),
    unit: PropTypes.string,
    unitFormat: PropTypes.oneOf(["long", "short", "narrow"]),
    currency: PropTypes.string,
    currencyFormat: PropTypes.oneOf(["symbol", "narrowSymbol", "code", "name"]),
    roundingMode: PropTypes.oneOf([
      "ceil",
      "floor",
      "expand",
      "trunc",
      "halfCeil",
      "halfFloor",
      "halfExpand",
      "halfTrunc",
      "halfEven",
    ]),
    roundingPosition: PropTypes.number,
    minDecimalDigits: PropTypes.number,
    maxDecimalDigits: PropTypes.number,
    minIntegerDigits: PropTypes.number,
    groupingSeparator: PropTypes.string,
    decimalSeparator: PropTypes.string,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    value: undefined,
    notation: undefined,
    format: undefined,
    unit: undefined,
    unitFormat: "short",
    currency: undefined,
    currencyFormat: "symbol",
    roundingMode: undefined,
    roundingPosition: undefined,
    minDecimalDigits: undefined,
    maxDecimalDigits: undefined,
    minIntegerDigits: undefined,
    groupingSeparator: undefined,
    decimalSeparator: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    let {
      value,
      notation,
      format,
      unit,
      unitFormat,
      currency,
      currencyFormat,
      roundingMode,
      roundingPosition,
      minDecimalDigits,
      maxDecimalDigits,
      groupingSeparator,
      decimalSeparator,
      minIntegerDigits,
    } = props;

    const [pref] = useUserPreferences();

    const [language] = useLanguage();
    const numberFormat = {};

    if (notation) numberFormat.notation = notation;

    if (format) {
      numberFormat.notation = "compact";
      numberFormat.compactDisplay = format;
    }

    if (currency) {
      numberFormat.style = "currency";
      numberFormat.currency = currency;
      groupingSeparator ||= pref.currencyGroupingSeparator;
      decimalSeparator ||= pref.currencyDecimalSeparator;
      if (currencyFormat) numberFormat.currencyDisplay = currencyFormat;
    } else if (unit) {
      numberFormat.style = "unit";
      numberFormat.unit = unit;
      if (unitFormat) numberFormat.unitDisplay = unitFormat;
    }

    groupingSeparator ||= pref.numberGroupingSeparator;
    decimalSeparator ||= pref.numberDecimalSeparator;

    if (maxDecimalDigits === undefined && !currency) numberFormat.maximumFractionDigits = 20;
    if (minDecimalDigits != null) numberFormat.minimumFractionDigits = minDecimalDigits;
    if (maxDecimalDigits != null) numberFormat.maximumFractionDigits = maxDecimalDigits;
    if (minIntegerDigits != null) numberFormat.minimumIntegerDigits = minIntegerDigits;
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    let formattedNumber = "";

    if (value != null) {
      const roundedValue =
        roundingMode || roundingPosition != null ? round(value, roundingPosition, roundingMode) : value;
      const numberFormatter = new Intl.NumberFormat(language, numberFormat);
      formattedNumber = numberFormatter.format(roundedValue);
      if (groupingSeparator || decimalSeparator) {
        const formatParts = numberFormatter.formatToParts(roundedValue);
        let formatWithTemplate;

        if (groupingSeparator !== null) {
          const separator = formatParts.find(({ type }) => type === "group")?.value;
          if (separator) formatWithTemplate = formattedNumber.replaceAll(separator, "$g$");
        }

        if (decimalSeparator) {
          const separator = formatParts.find(({ type }) => type === "decimal")?.value;
          if (separator) formatWithTemplate = (formatWithTemplate ?? formattedNumber).replaceAll(separator, "$d$");
        }

        if (formatWithTemplate) {
          formattedNumber = formatWithTemplate.replace(/\$g\$|\$d\$/gi, (matched) => {
            return matched === "$g$" ? groupingSeparator : decimalSeparator;
          });
        }
      }
    }

    const visualComponentProps = Tools.ensureVisualComponentDefinedProps(props);
    if (visualComponentProps) {
      //Note: there is property from visual component, number must be wrapped with element
      const attrs = Utils.VisualComponent.getAttrs(visualComponentProps);

      return <span {...attrs}>{formattedNumber}</span>;
    }

    return formattedNumber;
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { Number };
export default Number;
//@@viewOff:exports
