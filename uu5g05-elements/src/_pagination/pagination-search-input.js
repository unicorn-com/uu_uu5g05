//@@viewOn:imports
import { createVisualComponent, Utils, useState, PropTypes, useScreenSize, useDevice } from "uu5g05";
import ExtensionInput from "../_internal/extension-input.js";
import UuGds from "../_internal/gds.js";
import Config from "../config/config.js";
import importLsi from "../lsi/import-lsi.js";
//@@viewOff:imports

const PaginationSearchInput = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "PaginationSearchInput",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    count: PropTypes.number.isRequired,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const [headerSearchValue, setHeaderSearchValue] = useState("");

    const [screenSize] = useScreenSize();
    const { isMobileOrTablet, platform } = useDevice();
    const isMobile = screenSize === "xs" && isMobileOrTablet;

    const handleChangeSearchValue = (e) => {
      // setting pageIndex to undefined if the number input is cleared out
      setHeaderSearchValue(
        isNaN(parseInt(e.data.value)) ? "" : Math.max(Math.min(parseInt(e.data.value), props.count), 1) + "",
      );
    };

    function onChange() {
      if (headerSearchValue) {
        props.onChange(new Utils.Event({ index: Number(headerSearchValue) - 1 }));
      }
    }
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      <ExtensionInput
        value={headerSearchValue}
        type="text"
        onBlur={onChange}
        onChange={handleChangeSearchValue}
        size={isMobile ? "l" : "m"}
        placeholder={{ import: importLsi, path: ["Pagination", "search"] }}
        iconLeft="uugds-search"
        significance="distinct"
        inputAttrs={{
          onKeyDown: (e) => {
            if (e.key === "Enter" || e.key === "NumpadEnter") onChange();
          },
          min: 1,
          max: props.count,
          step: "1",
          inputMode: platform === "ios" ? "decimal" : "numeric",
        }}
        className={Css.input()}
      />
    );
    //@@viewOff:render
  },
});

//@@viewOn:helpers
const Css = {
  input: () =>
    Config.Css.css({
      paddingTop: UuGds.SpacingPalette.getValue(["fixed", "c"]),
      paddingInline: UuGds.SpacingPalette.getValue(["fixed", "c"]),
    }),
};
//@@viewOff:helpers

export { PaginationSearchInput };
export default PaginationSearchInput;
