//@@viewOn:imports
import { Utils, createVisualComponent, PropTypes, useRef, useEffect } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../config/config.js";
import { required } from "../config/validations.js";
import useFocusedItem from "../_internal/use-focused-item.js";
import withValidationMap from "../with-validation-map.js";
import withValidationInput from "../with-validation-input.js";
import InputCheckbox from "../_internal/input-checkbox.js";
//@@viewOff:imports

const Css = {
  main: ({ _pending }) =>
    Config.Css.css({
      display: "flex",
      flexDirection: "column",
      width: "100%",
      pointerEvents: _pending ? "none" : undefined,
      gap: Uu5Elements.UuGds.SpacingPalette.getValue(["fixed", "b"]),
      outline: "none",
    }),
};

const _CheckboxesInput = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Checkboxes.Input",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...InputCheckbox.propTypes,
    itemList: PropTypes.arrayOf(
      PropTypes.shape({
        value: PropTypes.any,
        children: PropTypes.oneOfType([PropTypes.node, PropTypes.lsi]),
      }),
    ),
    value: PropTypes.array,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    ...InputCheckbox.defaultProps,
    itemList: [],
    value: [],
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
      elementAttrs,
      onBlur,
      onFocus,
      _feedback,
      _pending,
      _onFeedbackClick,
      ...itemProps
    } = props;
    const { readOnly } = itemProps;

    for (let k in createVisualComponent.defaultProps) delete itemProps[k]; // don't duplicate className, id, ..., onto items (they're meant for root <div>)

    const onOptionClicked = (item) => (e) => {
      let eventData;
      if (value.includes(item.value)) {
        eventData = { value: value.filter((itemOfList) => itemOfList !== item.value) };
      } else {
        eventData = { value: [...value, item.value] };
      }

      onChange(new Utils.Event(eventData, e));
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
    // function blocks focus on first checkbox
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
    attrs.tabIndex = _pending || disabled ? undefined : attrs.tabIndex === undefined ? 0 : attrs.tabIndex;

    if (required) attrs["aria-required"] = true;

    const calculatedColorScheme = Config.COLOR_SCHEME_MAP[_feedback] || colorScheme;

    return (
      <div role="group" {...attrs} {...groupAttrs} ref={Utils.Component.combineRefs(attrs.ref, ref)}>
        {itemList.map((item, index) => {
          let stringValue = typeof item.value === "object" ? JSON.stringify(item.value) : String(item.value);
          let keyValue = typeof item.value + "_" + stringValue;
          return (
            <InputCheckbox
              key={keyValue}
              {...itemProps}
              onFocus={handleFocus}
              itemList={[
                { value: false },
                {
                  value: true,
                  colorScheme:
                    colorScheme === "dim" && (!_feedback || _feedback === "success")
                      ? "primary"
                      : calculatedColorScheme,
                  significance: "distinct",
                  icon: "uugds-check",
                },
              ]}
              value={value.includes(item.value)}
              onChange={readOnly || disabled || _pending ? undefined : onOptionClicked(item)}
              label={getLabel(item)}
              pending={index === 0 ? _pending : undefined}
              feedback={index === 0 ? _feedback : undefined}
              onFeedbackClick={index === 0 ? _onFeedbackClick : undefined}
              colorScheme={_feedback && _feedback !== "success" ? Config.COLOR_SCHEME_MAP[_feedback] : colorScheme}
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
      _CheckboxesInput.logger.warn(
        "Key 'label' is deprecated for itemList of Checkboxes.Input. Use 'children' instead.",
        item,
      );
    } else {
      result = value;
    }
  }
  return result;
}

function isValidValue(values) {
  return values.length > 0;
}

const CheckboxesInput = withValidationMap(withValidationInput(_CheckboxesInput, isValidValue), {
  required: required(),
});

// delete props which are not on API
["_formattedValue"].forEach((prop) => {
  delete CheckboxesInput.propTypes[prop];
  delete CheckboxesInput.defaultProps[prop];
});

//@@viewOff:helpers

export { CheckboxesInput };
export default CheckboxesInput;
