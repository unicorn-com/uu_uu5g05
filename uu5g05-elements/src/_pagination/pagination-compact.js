//@@viewOn:imports
import { createVisualComponent, PropTypes } from "uu5g05";
import Config from "../config/config.js";
import Tools from "../_internal/tools.js";
import PaginationButtons from "./pagination-buttons.js";
//@@viewOff:imports

let PaginationCompact = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "PaginationCompact",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    index: PropTypes.number,
    count: PropTypes.number.isRequired,
    onInputChange: PropTypes.func.isRequired,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { count, disabled, index } = props;

    let itemList = Tools.getPaginationItemList({
      count,
      disabled,
      index,
      type: "compact",
      handleMobileClick: props.onChange,
    });
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return <PaginationButtons {...props} itemList={itemList} />;
    //@@viewOff:render
  },
});

//@@viewOn:helpers
//@@viewOff:helpers

export { PaginationCompact };
export default PaginationCompact;
