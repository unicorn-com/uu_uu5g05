//@@viewOn:imports
import { createVisualComponent, PropTypes, useDevice, useLsi, Utils } from "uu5g05";
import UuGds from "../_internal/gds.js";
import Config from "../config/config.js";
import Button from "../button.js";
import Text from "../text.js";
import importLsi from "../lsi/import-lsi.js";
//@@viewOff:imports

// Default width of compact button
const COMPACT_BUTTON_SIZE = 132;

let PaginationButtons = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "PaginationButtons",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    itemList: PropTypes.array.isRequired,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { count, onInputChange, size, itemList } = props;

    const { height } = UuGds.getSizes("spot", "basic", size);
    const { browserName } = useDevice();

    function getOnButtonClick(page) {
      return (e) => {
        if (typeof onInputChange === "function") {
          onInputChange(new Utils.Event({ index: Math.min(page, count - 1) }, e));
        }
      };
    }
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const lsi = useLsi(importLsi, ["Pagination"]);
    const buttons = getButtons(props, height, getOnButtonClick, itemList, browserName, lsi);

    return buttons;
    //@@viewOff:render
  },
});

//@@viewOn:helpers
function getButtons(props, buttonSize, getOnButtonClick, itemList, browserName, lsi) {
  const { count, index, size, buttonRef } = props;

  // to get buttons except mobile view items
  return itemList.map((item) => {
    let { itemType, page, disabled, selected, onClick } = item;

    // Defined width prevents buttons from stretching
    let width = buttonSize;
    let buttonProps = {
      disabled,
      width,
      size,
      className: Config.Css.css({ "&&": { justifyContent: "unsafe center" } }),
    };
    let key = page ?? itemType;

    switch (itemType) {
      case "compactButton": {
        buttonProps.onClick = onClick;
        buttonProps.width = COMPACT_BUTTON_SIZE;
        buttonProps.children = (
          <Text
            autoFit
            className={Config.Css.css({ width: COMPACT_BUTTON_SIZE - 16, flex: "none", whiteSpace: "nowrap" })}
          >
            {/* NOTE We're formatting it directly so that Text's children change, i.e. Text is able to detect
                that it should recompute autofitting. */}
            {Utils.String.format(lsi["pageOf"], index + 1, count)}
          </Text>
        );
        buttonProps.elementRef = buttonRef;
        break;
      }
      case "page": {
        buttonProps.onClick = getOnButtonClick(page - 1);
        buttonProps.significance = selected ? "common" : "subdued";
        buttonProps.children = (
          <Text autoFit className={Config.Css.css({ width: width - 2, flex: "none", whiteSpace: "nowrap" })}>
            {page}
          </Text>
        );
        break;
      }
      case "first": {
        buttonProps.icon = "uugds-chevron-last-left";
        buttonProps.onClick = getOnButtonClick(0);
        buttonProps.significance = "subdued";
        break;
      }
      case "previous": {
        buttonProps.icon = "uugds-chevron-left";
        buttonProps.onClick = getOnButtonClick(index - 1);
        buttonProps.significance = "subdued";
        break;
      }
      case "next": {
        buttonProps.icon = "uugds-chevron-right";
        buttonProps.onClick = getOnButtonClick(index + 1);
        buttonProps.significance = "subdued";
        break;
      }
      case "last": {
        buttonProps.icon = "uugds-chevron-last-right";
        buttonProps.onClick = getOnButtonClick(count - 1);
        buttonProps.significance = "subdued";
        break;
      }
      case "start-ellipsis":
      case "end-ellipsis": {
        buttonProps.children = "...";
        buttonProps.significance = "subdued";
        buttonProps.disabled = true;
        break;
      }
    }

    return <Button {...buttonProps} key={key} />;
  });
}
//@@viewOff:helpers

export { PaginationButtons };
export default PaginationButtons;
