//@@viewOn:imports
import { createVisualComponent, useBackground, useDevice } from "uu5g05";
import { UuGds } from "uu5g05-elements";
import Config from "../config/config.js";
import DatePresets from "./date-presets.js";
//@@viewOff:imports

//@@viewOn:constants
//@@viewOff:constants

//@@viewOn:css
const Css = {
  main: ({ presetList, isMobileOrTablet }) => {
    let styles = {
      display: "flex",
      ...(presetList.length && !isMobileOrTablet && { flex: "0 1 504px", minHeight: 0 }),
    };

    if (!(!isMobileOrTablet && presetList.length > 1)) {
      styles.flexDirection = "column";
      styles.gap = UuGds.SpacingPalette.getValue(["fixed"]).e;
    }

    return Config.Css.css(styles);
  },
  presetList: ({ background, isMobileOrTablet, presetList }) => {
    const padding = UuGds.SpacingPalette.getValue(["fixed"]).e;
    const separatorStyles = UuGds.getValue(["Shape", "line", background, "building", "subdued"]).default;

    let styles;

    if (!isMobileOrTablet) {
      styles = {
        padding,
        borderRightWidth: separatorStyles?.border?.width,
        borderRightStyle: separatorStyles?.border?.style,
        borderRightColor: separatorStyles?.colors?.border,
        order: presetList.length > 1 ? 0 : 1,
      };
    } else {
      styles = {
        marginLeft: -padding,
        marginRight: -padding,
      };
    }

    return Config.Css.css(styles);
  },
};
//@@viewOff:css

//@@viewOn:helpers
//@@viewOff:helpers

const DatePickerContentWrapper = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "DatePickerContentWrapper",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { presetList, children } = props;
    const background = useBackground();
    const { isMobileOrTablet } = useDevice();
    //@@viewOff:private

    //@@viewOn:render
    return (
      <div className={Css.main({ presetList, isMobileOrTablet })}>
        <DatePresets className={Css.presetList({ background, isMobileOrTablet, presetList })} presetList={presetList} />
        {children}
      </div>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { DatePickerContentWrapper };
export default DatePickerContentWrapper;
//@@viewOff:exports
