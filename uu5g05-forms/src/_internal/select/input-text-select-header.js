//@@viewOn:imports
import { createVisualComponent, Utils, Lsi, useRef } from "uu5g05";
import { UuGds, Button } from "uu5g05-elements";
import Text from "../../text.js";
import Config from "../../config/config.js";
import importLsi from "../../lsi/import-lsi.js";
//@@viewOff:imports

//@@viewOn:css
const Css = {
  main: () =>
    Config.Css.css({
      padding: `0 ${UuGds.SpacingPalette.getValue(["fixed", "a"])}px`,
      display: "flex",
      flex: 0,
      justifyContent: "center",
      alignItems: "center",
      gap: UuGds.SpacingPalette.getValue(["fixed", "d"]),
    }),
  input: () =>
    Config.Css.css({
      flex: 1,
    }),
  button: () =>
    Config.Css.css({
      paddingInline: UuGds.SpacingPalette.getValue(["fixed", "b"]),
    }),
};

//@@viewOff:css

const InputTextSelectHeader = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "InputTextSelectHeader",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { value, pending, placeholder, onChange, onCancel, onOpen, ...otherProps } = props;
    const searchInputRef = useRef();
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const attrs = Utils.VisualComponent.getAttrs(otherProps, Css.main());
    const clearValueProps =
      typeof onChange === "function" && value
        ? {
            iconRight: "uugds-close",
            onIconRightClick: (e) => {
              onChange(new Utils.Event({ value: undefined }, e));
              searchInputRef.current.focus();
            },
          }
        : {};

    return (
      <div {...attrs}>
        <Text
          value={value}
          pending={pending}
          placeholder={placeholder}
          iconLeft="uugds-search"
          className={Css.input()}
          significance="distinct"
          autoFocus
          onChange={onChange}
          {...clearValueProps}
          inputRef={searchInputRef}
          elementAttrs={{
            onClick: () => searchInputRef.current?.focus(), // workaround for safari, focus must be forced
          }}
        />
        <Button significance="subdued" colorScheme="dim" size="s" className={Css.button()} onClick={onCancel}>
          <Lsi import={importLsi} path={["cancel"]} />
        </Button>
      </div>
    );
    //@@viewOff:render
  },
});

export { InputTextSelectHeader };
export default InputTextSelectHeader;
