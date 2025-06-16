//@@viewOn:imports
import { createVisualComponent, Lsi, PropTypes, useRef, useWillMount, Utils } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Uu5Forms from "uu5g05-forms";
import Config from "../../config/config";
import importLsi from "../../lsi/import-lsi.js";
//@@viewOff:imports

//@@viewOn:constants
const CSS_SELECTOR = "component";
//@@viewOff:constants

//@@viewOn:css
const Css = {
  message: () => Config.Css.css({ marginTop: Uu5Elements.UuGds.SpacingPalette.getValue(["fixed", "b"]) }),
};
//@@viewOff:css

//@@viewOn:helpers
function getStyleString(value) {
  let newValue = "";
  let keys = Object.keys(value);

  for (let i = 0; i < keys.length; i++) {
    let key = keys[i];
    let newKey = key.replace(/[A-Z]/g, (match) => "-" + match.toLowerCase()); // replacing upper letter with dash and lower letter
    let newValeu = value[key];
    if (typeof value[key] === "number") newValeu = value[key] + "px";
    let template = `${newKey}: ${newValeu}${i !== keys.length - 1 ? ";\n  " : ""}`;
    newValue += template;
  }
  return newValue;
}

function getDisplayedValue(value, isChangedValue) {
  let newValue;

  if (isChangedValue) {
    newValue = value;
  } else {
    let modifiedValue = "";
    if (typeof value === "string") {
      let valueAsObject = Utils.Style.parse(value);
      modifiedValue = getStyleString(valueAsObject);
    } else if (typeof value === "object") {
      modifiedValue = getStyleString(value);
    }
    let currValue = modifiedValue || value || "";

    newValue = `${CSS_SELECTOR} {
  ${currValue}
}`;
  }

  return newValue;
}

function getSelector(value) {
  let selector = CSS_SELECTOR;
  if (value) {
    let regex = /^component\s*{[^{}]*}$/;
    selector = regex.test(value) ? CSS_SELECTOR : "invalid-selector";
  }

  return selector;
}
//@@viewOff:helpers

const Style = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Style",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    value: undefined,
    label: <Lsi import={importLsi} path={["FormStyle", "label"]} />,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { value, onChange, onValidate, ...otherProps } = props;
    const displyedValueRef = useRef(getDisplayedValue(value, false));
    const isBadSelector = useRef(false);

    function handleChange(e) {
      displyedValueRef.current = getDisplayedValue(e.data.value, true);

      if (typeof onChange === "function") {
        onChange(new Utils.Event({ value: e.data.value }, e));
      }
    }

    if (process.env.NODE_ENV !== "production") {
      useWillMount(() => {
        Utils.LoggerFactory.get(Config.TAG + "FormStyle").error(
          `WARNING: This component is deprecated. It is recommended to use components from Uu5Editing instead. (https://uuapp.plus4u.net/uu-bookkit-maing01/5ee03d6a2be14b9f8d6e138b3ed3d250)`,
        );
      });
    }
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      <>
        <Uu5Forms.TextArea
          rows={15}
          {...otherProps}
          value={displyedValueRef.current}
          onChange={handleChange}
          onValidate={(e) => {
            if (typeof onValidate === "function") onValidate(e);
            isBadSelector.current = getSelector(displyedValueRef.current) !== CSS_SELECTOR;
            if (isBadSelector.current) {
              return {
                feedback: "error",
                message: <Lsi import={importLsi} path={["FormStyle", "error"]} />,
              };
            }
          }}
        />
        <Uu5Forms.Message className={Css.message()} size="s">
          <Lsi import={importLsi} path={["FormStyle", "message"]} />
        </Uu5Forms.Message>
      </>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { Style };
export default Style;
//@@viewOff:exports
