//@@viewOn:imports
import { createVisualComponent, PropTypes, useScreenSize, useDevice } from "uu5g05";
import Config from "../config/config.js";
import Tools from "../_internal/tools.js";
import PaginationButtons from "./pagination-buttons.js";
//@@viewOff:imports

let PaginationPage = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "PaginationPage",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    index: PropTypes.number,
    count: PropTypes.number.isRequired,
    onInputChange: PropTypes.func.isRequired,
    type: PropTypes.oneOf(["pages"]),
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { count, disabled, index } = props;

    const [screenSize] = useScreenSize();
    const { isMobileOrTablet } = useDevice();
    const isMobile = screenSize === "xs" && isMobileOrTablet;

    let itemList = Tools.getPaginationItemList({
      count,
      disabled,
      index,
      type: isMobile ? "mobile" : "pages",
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

export { PaginationPage };
export default PaginationPage;
