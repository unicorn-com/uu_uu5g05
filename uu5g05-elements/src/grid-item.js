//@@viewOn:imports
import { createVisualComponent, PropTypes, Utils } from "uu5g05";
import useGridItemStyle from "./_internal/use-grid-item-style.js";
import Config from "./config/config.js";
//@@viewOff:imports

//@@viewOn:helpers
//@@viewOff:helpers

const GridItem = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "GridItem",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    gridArea: PropTypes.string,
    colSpan: PropTypes.sizeOf(PropTypes.number),
    rowSpan: PropTypes.sizeOf(PropTypes.number),
    justifySelf: PropTypes.sizeOf(PropTypes.oneOf(["start", "end", "center", "stretch"])),
    alignSelf: PropTypes.sizeOf(PropTypes.oneOf(["start", "end", "center", "stretch"])),
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    gridArea: undefined,
    colSpan: undefined,
    rowSpan: undefined,
    justifySelf: undefined,
    alignSelf: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { children, gridArea, colSpan, rowSpan, justifySelf, alignSelf } = props;
    const style = useGridItemStyle({ gridArea, colSpan, rowSpan, justifySelf, alignSelf });
    //@@viewOff:private

    //@@viewOn:render
    const attrs = Utils.VisualComponent.getAttrs(props, Config.Css.css(style));

    return typeof children === "function" ? children({ style }) : <div {...attrs}>{children}</div>;
    //@@viewOff:render
  },
});

export { GridItem };
export default GridItem;
