//@@viewOn:imports
import { Lsi, Utils, createComponent, useEffect, useRef } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../../config/config.js";
import useValidatorMap from "../../use-validator-map.js";
import { splitMismatchedValues } from "./tools.js";
import importLsi from "../../lsi/import-lsi.js";
//@@viewOff:imports

function safeStringify(value) {
  if (value == null) return value + "";
  try {
    return JSON.stringify(value) || "";
  } catch (e) {
    try {
      return value.toString();
    } catch (e) {
      return "?";
    }
  }
}

function limitString(string, limit) {
  return string.length > limit ? string.slice(0, limit - 3) + "..." : string;
}

function withItemListValidation(Input) {
  return createComponent({
    //@@viewOn:statics
    uu5Tag: Config.TAG + `withItemListValidation(${Input.uu5Tag})`,
    //@@viewOff:statics

    //@@viewOn:propTypes
    propTypes: Input.propTypes,
    //@@viewOff:propTypes

    //@@viewOn:defaultProps
    defaultProps: Input.defaultProps,
    //@@viewOff:defaultProps

    render(props) {
      //@@viewOn:private
      const { insertable, itemList, onChange, value, multiple } = props;
      const validationRef = useRef();

      function getMatchingValues() {
        return splitMismatchedValues(value, itemList, multiple).value;
      }

      const currentValuesRef = useRef();
      useEffect(() => {
        currentValuesRef.current = { getMatchingValues, onChange };
      });

      //todo: update this with multilevel option
      const onValidate = useValidatorMap(props, {
        mismatch: (value) => {
          if (insertable || insertable === "add" || value == null) return true;
          let { disallowedList } = splitMismatchedValues(value, itemList, multiple);
          return disallowedList.length > 0
            ? {
                messageParams: [
                  limitString(disallowedList.map((it) => safeStringify(it)).join(", "), 100),
                  <Uu5Elements.Link
                    key="0"
                    elementAttrs={{
                      // using onMouseDown instead of standard onClick, because this message can be in tooltip (uu5tilesg02 filter
                      // bar item with inputType="text-select") and if user tries to click "click to fix" the tooltip gets closed
                      // sooner than our onClick
                      onMouseDown: (e) => {
                        const { getMatchingValues, onChange } = currentValuesRef.current;
                        if (typeof onChange === "function") {
                          onChange(new Utils.Event({ value: getMatchingValues() }));
                          // revalidate *after* React performs re-render
                          Promise.resolve().then(() => {
                            validationRef.current();
                          });
                        }
                      },
                    }}
                    onClick={(e) => {}} // for cursor/styles
                    disabled={typeof onChange !== "function"} // this onChange can become "old" but we don't have way to make it better currently
                  >
                    <Lsi import={importLsi} path={["Validation", "mismatchClickSelect"]} />
                  </Uu5Elements.Link>,
                ],
              }
            : true;
        },
      });
      //@@viewOff:private

      //@@viewOn:interface
      //@@viewOff:interface

      //@@viewOn:render
      return (
        <Input
          {...props}
          validationRef={Utils.Component.combineRefs(props.validationRef, validationRef)}
          onValidate={onValidate}
        />
      );
      //@@viewOff:render
    },
  });
}

export { withItemListValidation };
export default withItemListValidation;
