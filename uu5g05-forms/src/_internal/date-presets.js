//@@viewOn:imports
import { createVisualComponent, PropTypes, useDevice } from "uu5g05";
import { MenuList, ScrollableBox, UuGds } from "uu5g05-elements";
import Config from "../config/config.js";
//@@viewOff:imports

//@@viewOn:constants
//@@viewOff:constants

//@@viewOn:css
const Css = {
  main: ({ isRow, isMobileOrTablet }) => {
    const styles = {};

    if (isMobileOrTablet) {
      styles.paddingTop = UuGds.SpacingPalette.getValue(["fixed"]).c;
      styles.paddingBottom = UuGds.SpacingPalette.getValue(["fixed"]).e;
      styles["&>div"] = {
        display: "flex",
        width: "max-content",
      };
    } else if (!isRow) {
      styles.width = "fit-content";
      styles.minWidth = 128;
      styles.maxWidth = 180;
    } else {
      styles.width = "fit-content";
      styles.minWidth = 128;
      styles.maxWidth = 180;
      styles.wordBreak = "break-word";
    }

    return Config.Css.css(styles);
  },
};
//@@viewOff:css

const DatePresets = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "DatePresets",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    presetList: PropTypes.arrayOf(
      PropTypes.shape({
        onClick: PropTypes.func,
        children: PropTypes.node,
      }),
    ),
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    presetList: [],
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { presetList, ...otherProps } = props;
    const { isMobileOrTablet } = useDevice();

    const isRow = presetList.length > 1;
    //@@viewOff:private

    //@@viewOn:render
    return (
      <ScrollableBox {...otherProps} horizontal={isMobileOrTablet}>
        <MenuList itemList={presetList} className={Css.main({ isRow, isMobileOrTablet })} />
      </ScrollableBox>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { DatePresets };
export default DatePresets;
//@@viewOff:exports
