//@@viewOn:imports
import { createVisualComponent, Utils, PropTypes, Fragment } from "uu5g05";
import Config from "./config/config.js";
import UuGds from "./_internal/gds.js";
import InfoItem, { SUBTITLE_2LINE_TEXT_TYPE_MAP } from "./info-item.js";
import Line from "./line.js";
import Text from "./text.js";
import Icon from "./icon.js";
//@@viewOff:imports

//@@viewOn:constants
const TITLE_TEXT_TYPE_MAP = {
  xxs: "micro",
  xs: "micro",
  s: "micro",
  m: "micro",
  l: "micro",
  xl: "minor",
};
//@@viewOn:constants

//@@viewOn:css
const Css = {
  main: ({ vertical, displayLines, type }) => {
    return Config.Css.css({
      display: "flex",
      flexWrap: "wrap",
      flexDirection: vertical ? "column" : "row",
      alignItems: type === "bullet" && !vertical ? "center" : "flex-start",
      columnGap:
        type === "bullet"
          ? UuGds.getValue(["SpacingPalette", "fixed", "e"]) * (displayLines ? 1 : 4)
          : UuGds.getValue(["SpacingPalette", "fixed", "c"]),
      rowGap:
        type === "bullet"
          ? UuGds.getValue(["SpacingPalette", "fixed", "d"]) * (displayLines ? 1 : 2)
          : UuGds.getValue(["SpacingPalette", "fixed", "c"]),
      marginTop: UuGds.getValue(["SpacingPalette", "fixed", "e"]),
      marginBottom: UuGds.getValue(["SpacingPalette", "fixed", "e"]),
    });
  },
  lineSeparator: ({ size, vertical }) => {
    return Config.Css.css({
      "&&": {
        [vertical ? "height" : "width"]:
          UuGds.getValue(["SpacingPalette", "fixed", vertical ? "d" : "e"]) * 2 + "px !important",
        margin: vertical ? `0 ${(UuGds.getValue(["SizingPalette", "spot", "basic", size])?.h ?? 48) / 2 - 1}px` : 0,
      },
    });
  },
  item: ({ vertical, clickable }) => {
    return Config.Css.css({
      flex: vertical ? "1 1 auto" : 1,
      display: vertical ? "flex" : undefined,
      alignItems: vertical ? "center" : undefined,
      cursor: clickable ? "pointer" : undefined,
    });
  },
  line: ({ vertical }) => {
    const height = UuGds.SizingPalette.getValue(["spot", "minor", "xxs"])?.h;
    const cssBorderRadius = UuGds.RadiusPalette.getValue(["box", "full"], { height });
    return Config.Css.css({
      "&&": { borderWidth: height },
      borderRadius: cssBorderRadius,
      alignSelf: "stretch",
    });
  },
  textWrapper: ({ vertical }) => {
    return Config.Css.css({
      display: "block",
      [vertical ? "marginLeft" : "marginTop"]: UuGds.getValue(["SpacingPalette", "fixed", "b"]),
    });
  },
};
//@@viewOff:css

//@@viewOn:helpers
function getStepIcon(item, props, state) {
  const chooseStepIcon = (iconProp, defaultIcon, i) => item[iconProp] ?? props[iconProp] ?? item.icon ?? defaultIcon;

  switch (state) {
    case "active":
      return chooseStepIcon("iconActive", "uugds-pencil");
    case "alert":
      return chooseStepIcon("iconAlert", "uugds-alert");
    case "finished":
      return chooseStepIcon("iconFinished", "uugds-check");
    case "unfinished":
      return chooseStepIcon("iconUnfinished");
  }
}
//@@viewOff:helpers

const Stepper = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Stepper",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    itemList: PropTypes.arrayOf(
      PropTypes.shape({
        ...InfoItem.propTypes,
        iconUnfinished: PropTypes.string,
        iconActive: PropTypes.string,
        iconAlert: PropTypes.string,
        iconFinished: PropTypes.string,
      }),
    ),
    stepIndex: PropTypes.number,
    progressIndex: PropTypes.number,
    validityList: PropTypes.arrayOf(PropTypes.bool),
    size: PropTypes.oneOf(["xxs", "xs", "s", "m", "l", "xl"]),
    vertical: PropTypes.bool,
    displayLines: PropTypes.bool,
    iconUnfinished: PropTypes.string,
    iconActive: PropTypes.string,
    iconAlert: PropTypes.string,
    iconFinished: PropTypes.string,
    onChange: PropTypes.func,
    type: PropTypes.oneOf(["bullet", "linear"]),
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    validityList: undefined,
    size: "m",
    vertical: false,
    displayLines: true,
    iconUnfinished: undefined,
    iconActive: undefined, // "uugds-pencil"
    iconAlert: undefined, // "uugds-alert"
    iconFinished: undefined, // "uugds-check"
    type: "bullet",
  },
  //@@viewOff:defaultProps

  render(props) {
    const { itemList, size, vertical, displayLines, stepIndex, progressIndex, validityList, onChange, type } = props;

    //@@viewOn:hooks
    //@@viewOff:hooks

    //@@viewOn:private
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const attrs = Utils.VisualComponent.getAttrs(props, Css.main(props));

    return (
      <div {...attrs} role="tablist">
        {itemList?.map(({ title, subtitle, iconText, disabled, colorScheme, ...item }, index) => {
          const state =
            index === stepIndex
              ? "active"
              : validityList && validityList?.[index] === false
                ? "alert"
                : index <= progressIndex
                  ? "finished"
                  : "unfinished";

          const icon = type === "bullet" ? getStepIcon(item, props, state, index) : undefined;

          const onClick =
            ["finished", "alert"].includes(state) && typeof onChange === "function"
              ? (event) => onChange(new Utils.Event({ stepIndex: index, progressIndex }, event))
              : undefined;

          return type === "bullet" ? (
            <Fragment key={index}>
              {displayLines && !!index && (
                <Line
                  className={Css.lineSeparator({ size, vertical })}
                  colorScheme={state === "unfinished" ? "building" : "primary"}
                  direction={vertical ? "vertical" : "horizontal"}
                  significance="distinct"
                  testId="line"
                />
              )}
              <InfoItem
                title={title}
                subtitle={subtitle}
                icon={icon}
                iconText={iconText || (icon ? undefined : index + 1)}
                onClick={onClick}
                colorScheme={state === "alert" ? "warning" : state === "unfinished" ? "building" : "primary"}
                significance={state === "active" ? "highlighted" : "common"}
                disabled={disabled}
                size={size}
              />
            </Fragment>
          ) : type === "linear" ? (
            <span key={index} className={Css.item({ ...props, clickable: onClick })} onClick={onClick}>
              <Line
                className={Css.line(props)}
                colorScheme={
                  state === "unfinished" ? "building" : state === "alert" ? "warning" : colorScheme || "primary"
                }
                direction={vertical ? "vertical" : "horizontal"}
                significance={state === "active" || state === "alert" ? "highlighted" : "distinct"}
              />
              <span className={Css.textWrapper(props)}>
                {subtitle != null ? (
                  <Text
                    colorScheme={
                      state === "active" ? colorScheme || "primary" : state === "alert" ? "warning" : "building"
                    }
                    significance={state === "active" || state === "alert" ? "common" : "subdued"}
                    category="interface"
                    segment="content"
                    type={SUBTITLE_2LINE_TEXT_TYPE_MAP[size] || "xsmall"}
                    className={Config.Css.css({ display: "block" })}
                  >
                    {subtitle}
                  </Text>
                ) : null}
                {title != null ? (
                  <Text
                    colorScheme={state === "alert" ? "warning" : "building"}
                    significance={state === "active" || state === "alert" ? "common" : "subdued"}
                    category="interface"
                    segment="title"
                    type={TITLE_TEXT_TYPE_MAP[size] || "micro"}
                    className={Config.Css.css({ display: "block" })}
                  >
                    {state === "alert" ? (
                      <Icon icon="uugds-alert" margin={{ right: UuGds.SpacingPalette.getValue(["inline", "b"]) }} />
                    ) : null}
                    {title}
                  </Text>
                ) : null}
              </span>
            </span>
          ) : null;
        })}
      </div>
    );
    //@@viewOff:render
  },
});

export { Stepper };
export default Stepper;
