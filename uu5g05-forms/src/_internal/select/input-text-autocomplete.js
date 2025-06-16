//@@viewOn:imports
import { createVisualComponent, Utils, useBackground, Lsi } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../../config/config.js";
import { getPlaceholderStyles } from "../tools.js";
//@@viewOff:imports

const { type, ...inputPropTypes } = Uu5Elements.Input.propTypes;
const { type: _type, ...inputDefaultProps } = Uu5Elements.Input.defaultProps;

const Css = {
  main: () => Config.Css.css({ display: "grid" }),
  input: ({ size }) => {
    let inputStyles = Uu5Elements.Input._getInputStyles({ size, borderRadius: "none" });
    return Config.Css.css({
      ...inputStyles,
      color: "inherit",
      background: "transparent",
      opacity: 1,
      width: "100%",
      font: "inherit",
      minWidth: 2,
      border: 0,
      margin: 0,
      outline: 0,
      padding: 0,
      gridArea: "1 / 1 / auto / auto",
      zIndex: 1,
      height: "100%",
    });
  },
  placeholder: ({ background }) =>
    Config.Css.css({
      ...getPlaceholderStyles(background),
      gridArea: "1 / 1 / auto / auto",
      alignSelf: "center",
    }),
  autocompleteWrapper: ({ background }, searchValue) =>
    Config.Css.css({
      "&::before": {
        content: `"${searchValue}"`,
        visibility: "hidden",
        opacity: 0,
        marginLeft: 1, // gds does not specify this, but I think it's okay to leave 1px here
      },
      color: Uu5Elements.UuGds.Shape.getValue(["text", background, "building", "subdued"]).default.colors.foreground,
      whiteSpace: "nowrap",
      gridArea: "1 / 1 / auto / auto",
      minWidth: 0,
    }),
  autocomplete: () =>
    Config.Css.css({
      color: "inherit",
      background: "transparent",
      opacity: 1,
      font: "inherit",
      minWidth: 2,
      border: 0,
      margin: 0,
      outline: 0,
      padding: 0,
      gridArea: "1 / 1 / auto / auto",
      zIndex: 1,
      height: "100%",
    }),
};

const InputTextAutocomplete = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "InputTextAutocomplete",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: { ...inputPropTypes },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: { ...inputDefaultProps },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { value, autoCompleteValue, placeholder, inputRef, onChange, onFocus, onBlur, readOnly, inputDisabled } =
      props;
    const autocomplete = useAutocomplete(value, autoCompleteValue);

    const background = useBackground(props.background); // TODO Next major - remove props.background.
    const cssProps = { ...props, background };
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      <div {...Utils.VisualComponent.getAttrs(props, Css.main(cssProps))}>
        {placeholder ? (
          <div className={Css.placeholder(cssProps)}>
            {typeof placeholder === "object" ? <Lsi lsi={placeholder} /> : placeholder}
          </div>
        ) : null}
        {autocomplete ? (
          <div className={Css.autocompleteWrapper(cssProps, value)}>
            {/* Must be an input to align it with the other input */}
            <input className={Css.autocomplete()} value={autocomplete || ""} readOnly />
          </div>
        ) : null}
        <input
          type="text"
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          className={Css.input(cssProps)}
          ref={inputRef}
          readOnly={readOnly}
          autoComplete="off"
          disabled={inputDisabled}
        />
      </div>
    );
    //@@viewOff:render
  },
});

//@@viewOn:helpers
function useAutocomplete(value, autoCompleteValue) {
  let normalizedValue = normalizeString(value);
  let normalizedAutoCompleteValue = normalizeString(autoCompleteValue);
  let autocomplete;
  if (
    normalizedAutoCompleteValue &&
    normalizedAutoCompleteValue.startsWith(normalizedValue) &&
    normalizedAutoCompleteValue !== normalizedValue
  ) {
    autocomplete = autoCompleteValue.substring(value.length);
  }
  return autocomplete;
}

function normalizeString(string) {
  return string ? Utils.String.stripAccents(string.toLowerCase()) : string;
}
//@@viewOff:helpers

export { InputTextAutocomplete };
export default InputTextAutocomplete;
