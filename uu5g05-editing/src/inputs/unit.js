//@@viewOn:imports
import { createVisualComponent, Lsi, PropTypes, Utils } from "uu5g05";
import Uu5Forms from "uu5g05-forms";
import { ADAPTIVE_VALUE_LIST } from "./_spaces-input/tools.js";
import Config from "../config/config.js";
import importLsi from "../lsi/import-lsi.js";
//@@viewOff:imports

//@@viewOn:constants
const NUMBER_REGEXP = /^[0-9]+(\.[0-9]+)?$/; // number and decimal number with dot
//@@viewOff:constants

//@@viewOn:css
//@@viewOff:css

//@@viewOn:helpers
function getUnitRegexp(valueList) {
  let unitList = valueList;
  if (valueList.includes("adaptive")) unitList = valueList.filter((item) => item !== "adaptive");
  const validUnits = unitList.map((unit) => unit.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const regexString = `(${validUnits})$`;
  return new RegExp(regexString);
}

function getValidation(e, onValidate, unitList) {
  if (typeof onValidate === "function") onValidate(e);
  let value = e.data.value;
  let isBadValue = false;
  if (value && NUMBER_REGEXP.test(value)) {
    if (!unitList.includes("px")) isBadValue = true;
  } else if (value && !getUnitRegexp(unitList).test(value)) {
    if (unitList.includes("adaptive")) {
      let isValidValue = ADAPTIVE_VALUE_LIST.some((adaptiveValue) => adaptiveValue === value);
      if (!isValidValue) isBadValue = true;
    } else {
      isBadValue = true;
    }
  }
  if (isBadValue) {
    return {
      feedback: "error",
      message: <Lsi import={importLsi} path={["FormUnit", "error"]} />,
    };
  }
}
//@@viewOff:helpers

const Unit = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Unit",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    unitList: PropTypes.arrayOf(PropTypes.string),
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    unitList: ["px", "em", "rem", "%", "vh", "vw", "adaptive"],
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { onChange, unitList, onValidate, value, suffix, onBlur, ...otherProps } = props;

    const inOnlyPx = unitList.length === 1 && unitList.includes("px");
    const Component = inOnlyPx ? Uu5Forms.Number : Uu5Forms.Text;

    function handleChange(e) {
      if (typeof onChange === "function") {
        let newValue = NUMBER_REGEXP.test(e.data.value) ? Number(e.data.value) : e.data.value;
        onChange(new Utils.Event({ value: newValue }, e));
      }
    }
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      <Component
        {...otherProps}
        value={value}
        onChange={handleChange}
        suffix={suffix ? suffix : inOnlyPx ? "px" : undefined}
        onValidate={(e) => getValidation(e, onValidate, unitList)}
        onBlur={(e) => {
          if (typeof onBlur === "function") onBlur(e);
          if (typeof onChange === "function") {
            if (
              (typeof value === "number" || NUMBER_REGEXP.test(value)) &&
              unitList.includes("px") &&
              unitList.length !== 1
            ) {
              onChange(new Utils.Event({ value: value + "px" }, e));
            }
          }
        }}
      />
    );
    //@@viewOn:render
  },
});

//@@viewOn:exports
export { Unit };
export default Unit;
//@@viewOff:exports
