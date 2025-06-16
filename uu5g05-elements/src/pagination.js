//@@viewOn:imports
import { createVisualComponent, PropTypes, Utils, useState, useRef } from "uu5g05";
import UuGds from "./_internal/gds.js";
import Config from "./config/config.js";
import Popover from "./popover.js";
import PaginationSearchInput from "./_pagination/pagination-search-input.js";
import PaginationPage from "./_pagination/pagination-page.js";
import PaginationCompact from "./_pagination/pagination-compact.js";
import VirtualizedListPicker from "./virtualized-list-picker.js";
//@@viewOff:imports

// Default number of visible items in popover
const NUMBER_OF_VISIBLE_ITEMS = 7;

let Pagination = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Pagination",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    index: PropTypes.number,
    onChange: PropTypes.func.isRequired,
    count: PropTypes.number.isRequired,
    type: PropTypes.oneOf(["pages", "compact"]),
    size: PropTypes.oneOf(["xxs", "xs", "s", "m", "l", "xl"]),
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    index: 0,
    type: "pages",
    size: "m",
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { count, index: indexProps, onChange, type, ...otherProps } = props;
    // Limit check
    const index = Math.max(Math.min(indexProps, count - 1), 0);

    const [open, setOpen] = useState(false);
    const ref = useRef();

    const handleMobileClick = () => {
      setOpen(true);
    };

    function onInputChange(e) {
      if (e.data.index !== undefined) {
        if (typeof onChange === "function") onChange(e);
        setOpen(false);
      }
    }

    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const attrs = Utils.VisualComponent.getAttrs(props, Css.main());
    const virtualListHeight =
      UuGds.SizingPalette.getValue(["spot", "basic", "m"]).h * NUMBER_OF_VISIBLE_ITEMS +
      UuGds.SpacingPalette.getValue(["fixed", "a"]) * NUMBER_OF_VISIBLE_ITEMS;

    return (
      <>
        <div {...attrs}>
          {type === "pages" ? (
            <PaginationPage {...otherProps} index={index} count={count} onInputChange={onInputChange} />
          ) : (
            <PaginationCompact
              {...otherProps}
              index={index}
              count={count}
              onInputChange={onInputChange}
              onChange={handleMobileClick}
              buttonRef={ref}
            />
          )}
        </div>
        {open && (
          <Popover className={Css.popover()} onClose={() => setOpen(false)} initialState="full" element={ref.current}>
            {({ scrollRef }) => {
              return (
                <>
                  <PaginationSearchInput onChange={onInputChange} count={count} />
                  <VirtualizedListPicker
                    itemList={getMobileItemList(index, count)}
                    value={index + 1}
                    onSelect={(e) => {
                      if (typeof onInputChange === "function") {
                        onInputChange(new Utils.Event({ index: e.data.value - 1 }, e));
                      }
                    }}
                    itemSize="m"
                    height={count > NUMBER_OF_VISIBLE_ITEMS ? virtualListHeight : undefined}
                    ignoreScrollSelection
                    gap={UuGds.SpacingPalette.getValue(["fixed", "a"])}
                    valueAutoScroll
                    scrollElementRef={scrollRef}
                    scrollbarWidth={0}
                    scrollIndicator="disappear"
                    className={Css.virtualizedListPicker()}
                  />
                </>
              );
            }}
          </Popover>
        )}
      </>
    );
    //@@viewOff:render
  },
});

//@@viewOn:helpers
const Css = {
  main: () => Config.Css.css({ display: "inline-flex" }),
  popover: () => Config.Css.css({ display: "flex", flexDirection: "column", width: "250px" }),
  virtualizedListPicker: () => Config.Css.css({ padding: UuGds.SpacingPalette.getValue(["fixed", "c"]) }),
};

function getMobileItemList(index, count) {
  const mobileItemList = [];
  for (let i = 1; i <= count; i++) {
    let countIndex = i;

    mobileItemList[countIndex - 1] = {
      value: `${countIndex}`,
      children: countIndex,
      borderRadius: "moderate",
      colorScheme: countIndex - 1 === index ? "primary" : "building",
      significance: countIndex - 1 === index ? "distinct" : "common",
    };
  }
  return mobileItemList;
}
//@@viewOff:helpers

export { Pagination };
export default Pagination;
