//@@viewOn:imports
import { createVisualComponent, PropTypes } from "uu5g05";
import Config from "../config/config.js";
import Tools from "../_internal/tools.js";
import UuGds from "../gds.js";
import Grid from "../grid.js";
import TouchLink from "../touch-link.js";
//@@viewOff:imports

//@@viewOn:constants
const SIZE_MAP = {
  xs: ["basic", "xxs"],
  s: ["basic", "l"],
  m: ["major", "s"],
  l: ["major", "m"],
  xl: ["major", "l"],
};
const COLUMN_GAP = {
  xs: "c",
  s: "g",
  m: "h",
  l: "h",
  xl: "h",
};
const ROW_GAP = {
  xs: "c",
  s: "d",
  m: "e",
  l: "e",
  xl: "e",
};
//@@viewOff:constants

//@@viewOn:css
//@@viewOff:css

//@@viewOn:helpers
//@@viewOff:helpers

const TouchIconList = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "TouchIconList",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    itemList: PropTypes.arrayOf(
      PropTypes.shape({
        icon: PropTypes.string,
        colorScheme: PropTypes.colorScheme,
        significance: PropTypes.oneOf(["common", "highlighted", "distinct", "subdued"]),
        itemList: PropTypes.array,
        children: PropTypes.node,
        href: PropTypes.string,
        target: PropTypes.string,
        component: PropTypes.oneOfType([PropTypes.func, PropTypes.element]),
        onClick: PropTypes.func,
      }),
    ),
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    itemList: [],
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { itemList, ...otherProps } = props;

    const itemSize = itemList[0]?.size ?? "m";

    const { h: height } = UuGds.SizingPalette.getValue(["spot", ...SIZE_MAP[itemSize]]);
    //@@viewOff:private

    //@@viewOn:render
    return (
      <Grid
        {...otherProps}
        templateColumns={`repeat(auto-fit, ${height}px)`}
        alignItems="start"
        justifyItems="start"
        justifyContent="start"
        columnGap={UuGds.SpacingPalette.getValue(["fixed", COLUMN_GAP[itemSize]])}
        rowGap={UuGds.SpacingPalette.getValue(["fixed", ROW_GAP[itemSize]])}
      >
        {itemList.map(({ component, ...item }, i) => {
          const propsToPass = {
            key: i,
            ...item,
          };

          const Component = component ?? TouchLink;

          return Tools.getElement(Component, propsToPass);
        })}
      </Grid>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { TouchIconList };
export default TouchIconList;
//@@viewOff:exports
