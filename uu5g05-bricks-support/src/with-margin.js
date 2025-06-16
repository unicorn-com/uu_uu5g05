//@@viewOn:imports
import { createComponent, Utils, PropTypes } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "./config/config.js";
//@@viewOff:imports

//@@viewOn:constants
const KEYS = ["marginLeft", "marginRight", "marginTop", "marginBottom"];
//@@viewOff:constants

//@@viewOn:css
//@@viewOff:css

//@@viewOn:helpers
function getValuesForAllSides(originalValue) {
  let valueParts = originalValue.split(" ");

  let [top, right, bottom, left] = [
    valueParts[0],
    valueParts[1] ?? valueParts[0],
    valueParts[2] ?? valueParts[0],
    valueParts[3] ?? valueParts[1] ?? valueParts[0],
  ];
  return { marginLeft: left, marginRight: right, marginTop: top, marginBottom: bottom };
}

function filterValue(value, validStyle) {
  let result = {};

  for (let key in value) {
    if (key.startsWith("@media")) {
      // value = { "@media screen and (min-width: 481px)": {margin: "20px"}, margin: "10px" }
      // value = { "@media screen and (min-width: 481px) and (max-width: 768px)": { marginLeft: 4, marginRight: 8 }}
      let modifiedMargin = filterValue(value[key], validStyle);
      result[key] = modifiedMargin;
    } else if (key === "margin") {
      if (typeof value[key] === "number") {
        // value = { margin: 4 }
        for (let styleKey in validStyle) {
          if (validStyle[styleKey]) result[styleKey] = value[key];
        }
      } else {
        // value = { margin: "4px 8px" }
        let marginStyle = getValuesForAllSides(value[key]);
        for (let styleKey in validStyle) {
          if (validStyle[styleKey]) result[styleKey] = marginStyle[styleKey];
        }
      }
    } else if (KEYS.includes(key)) {
      // value = { "marginLeft": 4, "marginRight": "1em" }
      for (let marginKey of KEYS) {
        if (marginKey === key && validStyle[key]) result[key] = value[key];
      }
    }
  }

  return result;
}

function calcWidth(value, width) {
  let result = {};

  for (let key in value) {
    if (key.startsWith("@media")) {
      result[key] = calcWidth(value[key], width);
      continue;
    }

    if (key === "margin") {
      if (typeof value[key] === "number") {
        result.width = `calc(${width} - ${2 * value[key]}px)`;
        continue;
      }
      const marginStyle = getValuesForAllSides(value[key]);
      const diff = [];
      if (marginStyle.marginLeft) diff.push(marginStyle.marginLeft);
      if (marginStyle.marginRight) diff.push(marginStyle.marginRight);

      result.width = `calc(${width} - ${diff.join(" - ")})`;
      continue;
    }

    const diff = [];
    if (key === "marginLeft") diff.push(value.marginLeft);
    if (key === "marginRight") diff.push(value.marginRight);

    if (diff.length) result.width = `calc(${width} - ${diff.join(" - ")})`;
  }

  return result;
}
//@@viewOff:helpers

// TODO Next major - remove ComponentStatics from parameters (we should read those directly from Component).
function withMargin(Component, ComponentStatics = Component) {
  const ResultComponent = createComponent({
    //@@viewOn:statics
    uu5Tag: `withMargin(${Component.uu5Tag})`,
    //@@viewOff:statics

    //@@viewOn:propTypes
    propTypes: {
      ...Component.propTypes,
      margin: PropTypes.sizeOf(PropTypes.space),
    },
    //@@viewOff:propTypes

    //@@viewOn:defaultProps
    defaultProps: {
      ...Component.defaultProps,
      margin: Component.defaultProps?.margin !== undefined ? Component.defaultProps.margin : "b 0",
    },
    //@@viewOff:defaultProps

    render(props) {
      //@@viewOn:private
      const { margin: propsMargin, className, ...componentProps } = props;
      const currentNestingLevel = Utils.NestingLevel.getNestingLevel(props, ComponentStatics);
      const spacing = Uu5Elements.useSpacing();
      let componentClass = className;

      if (propsMargin) {
        let validMargin = Utils.Style.replaceAdaptiveSpacing(propsMargin, spacing);
        let formattedMargin = Utils.ScreenSize.convertStringToObject(validMargin);
        let marginStyle = Utils.Style.parseSpace(formattedMargin, "margin");
        let withWidthCalculation = componentProps.width === "100%";

        if (currentNestingLevel && (currentNestingLevel === "area" || currentNestingLevel === "areaCollection")) {
          marginStyle = filterValue(marginStyle, {
            marginLeft: false,
            marginRight: false,
            marginTop: true,
            marginBottom: true,
          });
        } else if (
          (ComponentStatics.nestingLevel && currentNestingLevel === null) ||
          currentNestingLevel === "inline"
        ) {
          marginStyle = filterValue(marginStyle, {
            marginLeft: true,
            marginRight: true,
            marginTop: false,
            marginBottom: false,
          });
          withWidthCalculation = false;
        }

        if (marginStyle !== undefined) {
          let marginClass = Config.Css.css(marginStyle);

          if (withWidthCalculation) {
            const widthStyle = calcWidth(marginStyle, componentProps.width);
            marginClass = Utils.Css.joinClassName(marginClass, Config.Css.css({ "&&": widthStyle }));
          }

          componentClass = Utils.Css.joinClassName(marginClass, className);
        }
      }
      //@@viewOff:private

      //@@viewOn:interface
      //@@viewOff:interface

      //@@viewOn:render
      return <Component {...componentProps} className={componentClass} />;
    },
    //@@viewOff:render
  });
  Utils.Component.mergeStatics(ResultComponent, Component);
  ResultComponent.nestingLevel = ComponentStatics.nestingLevel;
  return ResultComponent;
}

//@@viewOn:exports
export { withMargin };
export default withMargin;
//@@viewOff:exports
