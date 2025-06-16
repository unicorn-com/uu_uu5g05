//@@viewOn:imports
import { Utils, createVisualComponent, PropTypes, useRef, useEffect } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../config/config.js";
import { required } from "../config/validations.js";
import useFocusedItem from "../_internal/use-focused-item.js";
import withValidationInput from "../with-validation-input.js";
import withValidationMap from "../with-validation-map.js";
import InputRadio from "../_internal/input-radio.js";
//@@viewOff:imports

const Css = {
  main: ({ _pending }) =>
    Config.Css.css({
      display: "flex",
      flexDirection: "column",
      width: "100%",
      pointerEvents: _pending ? "none" : undefined,
      gap: Uu5Elements.UuGds.SpacingPalette.getValue(["fixed", "a"]), // TODO gds does not specify this
      outline: "none",
    }),
};

const _RadiosInput = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Radios.Input",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...InputRadio.propTypes,
    value: PropTypes.any,
    itemList: PropTypes.arrayOf(
      PropTypes.shape({
        value: PropTypes.any,
        children: PropTypes.oneOfType([PropTypes.node, PropTypes.lsi]),
      }),
    ),
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    ...InputRadio.defaultProps,
    itemList: [],
    value: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const {
      required,
      autoFocus,
      onChange,
      value,
      itemList,
      disabled,
      colorScheme,
      _feedback,
      _pending,
      _onFeedbackClick,
      onFocus,
      onBlur,
      ...itemProps
    } = props;
    const { readOnly } = itemProps;

    for (let k in createVisualComponent.defaultProps) delete itemProps[k]; // don't duplicate className, id, ..., onto items (they're meant for root <div>)

    const onOptionClicked = (item) => (e) => {
      onChange(new Utils.Event({ value: item.value }, e));
    };

    const [focusedIndex, setFocusedIndex, groupAttrs] = useFocusedItem({
      ...props,
      disabled: disabled || _pending,
      onChange: onOptionClicked,
    });

    const clickRef = useRef();
    useEffect(() => {
      const timeout = setTimeout(() => (clickRef.current = null), 100);
      return () => clearTimeout(timeout);
    }, [focusedIndex]);

    const ref = useRef();

    // function blocks focus on first radio
    function handleFocus(e) {
      e.preventDefault();
    }

    useEffect(() => {
      if (autoFocus) ref.current.focus();
    }, []);
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const attrs = Utils.VisualComponent.getAttrs(props, Css.main(props));
    attrs.tabIndex = _pending || disabled ? undefined : attrs.tabIndex || 0;

    if (required) attrs["aria-required"] = true;

    const calculatedColorScheme = (_feedback !== "success" && Config.COLOR_SCHEME_MAP[_feedback]) || colorScheme;

    return (
      <div role="radiogroup" {...attrs} {...groupAttrs} ref={Utils.Component.combineRefs(attrs.ref, ref)}>
        {itemList.map((item, index) => {
          let stringValue = typeof item.value === "object" ? JSON.stringify(item.value) : String(item.value);
          let keyValue = typeof item.value + "_" + stringValue;
          return (
            <InputRadio
              key={keyValue}
              {...itemProps}
              onFocus={handleFocus}
              value={item.value === value}
              onChange={readOnly || disabled || _pending ? undefined : onOptionClicked(item)}
              label={getLabel(item)}
              pending={index === 0 ? _pending : undefined}
              feedback={index === 0 ? _feedback : undefined}
              onFeedbackClick={index === 0 ? _onFeedbackClick : undefined}
              colorScheme={calculatedColorScheme}
              focused={clickRef.current ? false : index === focusedIndex}
              inputAttrs={{ tabIndex: null }}
              elementAttrs={{
                onMouseDown: () => {
                  clickRef.current = true;
                  setFocusedIndex(index);
                },
              }}
            />
          );
        })}
      </div>
    );
    //@@viewOff:render
  },
});

function getLabel(item) {
  const { children, label, value } = item;
  let result = children;
  if (children == null) {
    if (label != null) {
      result = label;
      _RadiosInput.logger.warn("Key 'label' is deprecated for itemList of Radios.Input. Use 'children' instead.", item);
    } else {
      result = value;
    }
  }
  return result;
}

function isValidValue(value) {
  return value != null && value !== "" && value !== false;
}

const RadiosInput = withValidationMap(withValidationInput(_RadiosInput, isValidValue), { required: required() });

// delete props which are not on API
["_formattedValue"].forEach((prop) => {
  delete RadiosInput.propTypes[prop];
  delete RadiosInput.defaultProps[prop];
});

//@@viewOn:helpers
//@@viewOff:helpers

export { RadiosInput };
export default RadiosInput;
