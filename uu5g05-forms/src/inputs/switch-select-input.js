import { createVisualComponent, useLayoutEffect, useState, useRef, useElementSize, Utils } from "uu5g05";
import Config from "../config/config.js";
import { required } from "../config/validations.js";
import withValidationMap from "../with-validation-map.js";
import withValidationInput from "../with-validation-input.js";
import InputSwitchSelect from "../_internal/select/input-switch-select.js";
import { SelectInputNoValidation } from "./select-input.js";

function useOverflow(width, initValue = false) {
  const [isOverflow, setIsOverflow] = useState(initValue);
  const ref = useRef();

  useLayoutEffect(() => {
    const scrollWidth = ref.current.scrollWidth;
    const offsetWidth = ref.current.getBoundingClientRect().width;
    setIsOverflow(scrollWidth > Math.ceil(offsetWidth));
  }, [width]);

  return [isOverflow, ref];
}

const _SwitchSelectInput = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "SwitchSelect.Input",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...InputSwitchSelect.propTypes,
    itemList: InputSwitchSelect.propTypes.itemList,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    ...InputSwitchSelect.defaultProps,
    itemList: InputSwitchSelect.defaultProps.itemList,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { elementRef } = props;

    const { ref, width } = useElementSize();
    let [isOverflow, overflowRef] = useOverflow(width);
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      <>
        <InputSwitchSelect
          {...props}
          elementRef={Utils.Component.combineRefs(ref, overflowRef, elementRef)}
          className={
            isOverflow
              ? Config.Css.css({
                  display: "grid!important", // because grid-inline keep some place under the select :-(
                  visibility: "hidden!important",
                  overflow: "hidden!important",
                  pointerEvents: "none!important",
                  height: "0px!important",
                  border: "none!important",
                })
              : props.className
          }
        />
        {isOverflow && <SelectInputNoValidation {...props} />}
      </>
    );
    //@@viewOff:render
  },
});

//@@viewOn:helpers
//@@viewOff:helpers

const SwitchSelectInput = withValidationMap(withValidationInput(_SwitchSelectInput), { required: required() });

export { SwitchSelectInput };
export default SwitchSelectInput;
