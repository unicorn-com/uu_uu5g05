//@@viewOn:imports
import { createVisualComponent, useRef, Utils, PropTypes, useDevice } from "uu5g05";
import { Popover, UuGds } from "uu5g05-elements";
import Config from "../../config/config.js";
import { useViewportHeight } from "./use-viewport-height.js";
//@@viewOff:imports

//@@viewOn:constants
const STATIC_TOP_GAP = 40;
const PICKER_TOP_OFFSET = 20;
const ITEM_LIST_HEIGHTS = {
  singleItem: 40,
  gap: 2,
  marginTop: 12,
};
const CONTENT_OFFSET = {
  header: 40,
  footer: 64,
};
//@@viewOff:constants

//@@viewOn:css
const Css = {
  popover: (bottomOffset) =>
    Config.Css.css({
      "&&": {
        boxShadow: "none",
        paddingLeft: 0,
        paddingRight: 0,
        bottom: bottomOffset || 0,
      },
    }),
  selectOptions: () =>
    Config.Css.css({
      marginTop: UuGds.SpacingPalette.getValue(["fixed", "d"]),
      padding: 0,
      minWidth: "100%",
    }),
  searchInputList: (height) =>
    Config.Css.css({
      display: "flex",
      flexDirection: "column",
      height,
      paddingLeft: UuGds.SpacingPalette.getValue(["fixed", "e"]),
      paddingRight: UuGds.SpacingPalette.getValue(["fixed", "e"]),
    }),
};
//@@viewOff:css

//@@viewOn:helpers
//@@viewOff:helpers

const InputSelectPickerBottomSheet = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "InputSelectPickerBottomSheet",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    header: PropTypes.node,
    footer: PropTypes.node,
    multilevel: PropTypes.bool,
    itemListLength: PropTypes.number,
    heightOffset: PropTypes.number,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    header: undefined,
    footer: undefined,
    multiple: false,
    itemListLength: 0,
    heightOffset: 0,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { header, footer, className, itemListLength, children, heightOffset, ...otherProps } = props;

    const { viewportHeight, bottomOffset } = useViewportHeight();
    const { platform } = useDevice();
    const isIos = platform === "ios";

    // Store initial itemList length and update it only when itemList length is raised
    // We need this initial value for proper height calculation
    const initialItemListLengthRef = useRef(itemListLength);
    if (itemListLength > initialItemListLengthRef.current) initialItemListLengthRef.current = itemListLength;

    // Store bottomOffset and update this value only when is larger than zero
    const bottomOffsetRef = useRef(0);
    if (bottomOffset) bottomOffsetRef.current = bottomOffset;

    function getContentHeight() {
      const items = initialItemListLengthRef.current;
      let itemsHeight = items * ITEM_LIST_HEIGHTS.singleItem + (items + 1) * ITEM_LIST_HEIGHTS.gap;

      let contentOffset = ITEM_LIST_HEIGHTS.marginTop;
      if (header) contentOffset += CONTENT_OFFSET.header;
      if (footer) contentOffset += CONTENT_OFFSET.footer;

      let height = itemsHeight + heightOffset + contentOffset;

      // Add stored bottomOffset if current bottomOffset is higher than zero
      if (bottomOffset === 0) height += bottomOffsetRef.current;

      // Return calculate height if it's smaller than maxViewPortHeight
      const maxViewportHeight = viewportHeight - STATIC_TOP_GAP - PICKER_TOP_OFFSET;
      return height > maxViewportHeight ? maxViewportHeight : height;
    }
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const selectOptionsProps = {
      className: Utils.Css.joinClassName(Css.selectOptions(), className),
      maxHeight: viewportHeight,
    };

    return (
      <Popover
        {...otherProps}
        className={Css.popover(isIos ? undefined : bottomOffset)}
        initialState="full"
        bottomSheet
      >
        {({ scrollRef }) => {
          return (
            <div className={Css.searchInputList(getContentHeight())}>
              {header}
              {itemListLength ? children({ ...selectOptionsProps, elementRef: scrollRef }) : null}
              {footer}
            </div>
          );
        }}
      </Popover>
    );
    //@@viewOff:render
  },
});

export default InputSelectPickerBottomSheet;
