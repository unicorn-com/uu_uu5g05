//@@viewOn:imports
import { createVisualComponent, PropTypes, Utils } from "uu5g05";
import Config from "./config/config.js";
import useGridStyle from "./_internal/use-grid-style.js";
import GridItem from "./grid-item.js";
//@@viewOff:imports

const ALIGN_VALUES = ["start", "end", "center", "stretch", "space-around", "space-between", "space-evenly"];

//@@viewOn:helpers
//@@viewOff:helpers

const Grid = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Grid",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    display: PropTypes.oneOf(["block", "inline"]),
    templateAreas: PropTypes.sizeOf(PropTypes.string),
    templateRows: PropTypes.sizeOf(PropTypes.string),
    autoRows: PropTypes.sizeOf(PropTypes.string),
    templateColumns: PropTypes.sizeOf(PropTypes.string),
    autoColumns: PropTypes.sizeOf(PropTypes.string),
    rowGap: PropTypes.sizeOf(PropTypes.unit),
    columnGap: PropTypes.sizeOf(PropTypes.unit),
    justifyItems: PropTypes.sizeOf(PropTypes.oneOf(["start", "end", "center", "stretch"])),
    alignItems: PropTypes.sizeOf(PropTypes.oneOf(["start", "end", "center", "stretch", "baseline"])),
    justifyContent: PropTypes.sizeOf(PropTypes.oneOf(ALIGN_VALUES)),
    alignContent: PropTypes.sizeOf(PropTypes.oneOf(ALIGN_VALUES)),
    flow: PropTypes.sizeOf(PropTypes.oneOf(["row", "column", "dense"])),
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    display: "block",
    templateAreas: undefined,
    templateRows: undefined,
    autoRows: undefined,
    templateColumns: undefined,
    autoColumns: undefined,
    rowGap: undefined,
    columnGap: undefined,
    justifyItems: undefined,
    alignItems: undefined,
    justifyContent: undefined,
    alignContent: undefined,
    flow: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { children, ...restProps } = props;
    const style = useGridStyle(restProps);
    //@@viewOff:private

    //@@viewOn:render
    const attrs = Utils.VisualComponent.getAttrs(props, Config.Css.css(style));

    return typeof children === "function" ? children({ style }) : <div {...attrs}>{children}</div>;
    //@@viewOff:render
  },
});

Grid.Item = GridItem;

export { Grid };
export default Grid;
