//@@viewOn:imports
import { Lsi, PropTypes, createVisualComponent, useBackground, useLsi } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import { ADAPTIVE_VALUE_LIST, NUMBER_REGEXP } from "./tools.js";
import Config from "../../config/config";
import importLsi from "../../lsi/import-lsi.js";
//@@viewOff:imports

//@@viewOn:constants
//@@viewOff:constants

//@@viewOn:css
const Css = {
  orangeBox: ({ background, height }) => {
    return Config.Css.css({
      position: "relative",
      width: "100%",
      height,
      borderRadius: Uu5Elements.UuGds.getValue(["RadiusPalette", "box", "moderate"]),
      ...Uu5Elements.UuGds.Shape.getStateStyles(
        Uu5Elements.UuGds.Shape.getValue(["background", background, "orange", "common", "default"]),
      ),
      fontSize: "14px", // due to calculate max value in em
    });
  },
  greenBox: ({ background, margin, spacing }) => {
    const border = Uu5Elements.UuGds.getValue(["BorderPalette", "dashedThin"]);
    const borderColor = Uu5Elements.UuGds.Shape.getStateStyles(
      Uu5Elements.UuGds.Shape.getValue(["ground", background, "grey", "subdued", "default"]),
    ).borderColor;

    return Config.Css.css({
      position: "absolute",
      borderColor,
      borderStyle: border.style,
      borderWidth: border.width,
      borderRadius: Uu5Elements.UuGds.getValue(["RadiusPalette", "box", "moderate"]),
      ...Uu5Elements.UuGds.Shape.getStateStyles(
        Uu5Elements.UuGds.Shape.getValue(["background", background, "green", "common", "default"]),
      ),
      ...getStyles(margin, spacing),
      transitionProperty: "top, right, bottom, left",
      transitionDuration: "1s",
      transitionTimingFunction: "ease",
    });
  },
  whiteBox: ({ background, padding, spacing }) => {
    const buildingBg = ["light", "soft"].includes(background) ? "light" : "dark";

    return Config.Css.css({
      position: "absolute",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: Uu5Elements.UuGds.getValue(["RadiusPalette", "box", "moderate"]),
      backgroundColor: Uu5Elements.UuGds.ColorPalette.getValue(["building", buildingBg, "main"]),
      ...getStyles(padding, spacing),
      transitionProperty: "top, right, bottom, left",
      transitionDuration: "0.5s",
      transitionTimingFunction: "ease",
    });
  },
  legend: () =>
    Config.Css.css({
      display: "flex",
      gap: Uu5Elements.UuGds.SpacingPalette.getValue(["fixed", "e"]),
      marginTop: Uu5Elements.UuGds.SpacingPalette.getValue(["fixed", "c"]),
      marginBottom: Uu5Elements.UuGds.SpacingPalette.getValue(["fixed", "e"]),
    }),
  text: ({ style }) => Config.Css.css({ ...style, display: "inline-flex", alignItems: "center" }),
  colorBox: ({ style, color, background }) =>
    Config.Css.css({
      display: "inline-block",
      width: style.fontSize,
      aspectRatio: 1 / 1,
      borderRadius: "50%",
      marginRight: Uu5Elements.UuGds.SpacingPalette.getValue(["fixed", "b"]),
      ...Uu5Elements.UuGds.Shape.getStateStyles(
        Uu5Elements.UuGds.Shape.getValue(["background", background, color, "common", "default"]),
      ),
    }),
};
//@@viewOff:css

//@@viewOn:helpers
function getValidValue(value, spacing) {
  let result = 0;

  let max = spacing.d; // spacing.d is max size for margin/padding view
  if (typeof value === "number" || (typeof value === "string" && NUMBER_REGEXP.test(value))) {
    result = value > max ? max : value + "px";
  } else if (typeof value === "string" && value.endsWith("px")) {
    let modifiedValue = Number(value.replace("px", ""));
    result = modifiedValue > max ? max : value;
  } else if (typeof value === "string" && value.endsWith("%")) {
    let modifiedValue = Number(value.replace("%", ""));
    max = 10; // %
    result = modifiedValue > max ? max + "%" : value;
  } else if (typeof value === "string" && value.endsWith("em")) {
    let modifiedValue = Number(value.replace("em", ""));
    max = 2; // em (parent element has font-size: 14px)
    result = modifiedValue > max ? max + "em" : value;
  } else if (ADAPTIVE_VALUE_LIST.includes(value)) {
    result = spacing[value];
  }
  return result;
}

function getStyles(value, spacing) {
  let styles;

  if (value) {
    styles = {
      top: getValidValue(value.top, spacing),
      right: getValidValue(value.right, spacing),
      bottom: getValidValue(value.bottom, spacing),
      left: getValidValue(value.left, spacing),
    };
  } else {
    styles = { top: 0, right: 0, bottom: 0, left: 0 };
  }
  return styles;
}
//@@viewOff:helpers

const ComponentView = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "ComponentView",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    margin: PropTypes.space,
    padding: PropTypes.space,
    height: PropTypes.unit,
    displayLegends: PropTypes.bool,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    margin: undefined,
    padding: undefined,
    height: 100,
    displayLegends: false,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { margin, padding, height, displayLegends } = props;
    const lsi = useLsi({ import: importLsi, path: ["FormSpaces"] });
    const children = lsi.component.toUpperCase();
    const background = useBackground();
    const spacing = Uu5Elements.useSpacing();
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      <>
        <div className={Css.orangeBox({ background, height })}>
          <div className={Css.greenBox({ background, margin, spacing })}>
            <div className={Css.whiteBox({ background, padding, spacing })}>{children}</div>
          </div>
        </div>
        {displayLegends && (
          <Uu5Elements.Text category="interface" segment="content" type="small">
            {({ style }) => (
              <div className={Css.legend()}>
                <Uu5Elements.Text className={Css.text({ style })} colorScheme="building" significance="subdued">
                  <div className={Css.colorBox({ style, color: "orange", background })}></div>
                  <Lsi import={importLsi} path={["FormSpaces", "outerSpacing"]} /> (margin)
                </Uu5Elements.Text>

                <Uu5Elements.Text className={Css.text({ style })} colorScheme="building" significance="subdued">
                  <div className={Css.colorBox({ style, color: "green", background })}></div>
                  <Lsi import={importLsi} path={["FormSpaces", "innerSpacing"]} /> (padding)
                </Uu5Elements.Text>
              </div>
            )}
          </Uu5Elements.Text>
        )}
      </>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { ComponentView };
export default ComponentView;
//@@viewOff:exports
