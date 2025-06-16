//@@viewOn:imports
import { createComponent, Utils, useState, useUpdateEffect, useRef, useMemo } from "uu5g05";
import Config from "../../config/config.js";
import InputSelectControls from "./input-select-controls.js";
import useDependencyValue from "./use-dependency-value.js";
import { getOutputValue, sortByArray } from "./tools.js";
//@@viewOff:imports

//@@viewOn:helpers
//@@viewOff:helpers

function withSelectBottomSheet(Input) {
  return createComponent({
    //@@viewOn:statics
    uu5Tag: Config.TAG + `withSelectBottomSheet(${Input.uu5Tag})`,
    //@@viewOff:statics

    //@@viewOn:propTypes
    propTypes: Input.propTypes,
    //@@viewOff:propTypes

    //@@viewOn:defaultProps
    defaultProps: Input.defaultProps,
    //@@viewOff:defaultProps

    render(props) {
      //@@viewOn:private
      const { value, onChange, elementRef, itemList, ...otherProps } = props;
      const { open, multiple, onOpen, level, multilevel } = otherProps;

      const inputBoxRef = useRef();

      const [valueBeforeSubmit, setValueBeforeSubmit] = useState(value);

      // Sorting
      const deps = useMemo(() => ({ open, level }), [open, level]);
      const dependencyValue = useDependencyValue(valueBeforeSubmit, deps);

      const sortedItemList = sortByArray(itemList, dependencyValue);

      useUpdateEffect(() => {
        if (!open) setValueBeforeSubmit(value);
      }, [value, open]);

      function handleChange(e) {
        if (open && multiple) {
          const eventValue = getOutputValue(e.data.value, valueBeforeSubmit, sortedItemList);
          setValueBeforeSubmit(eventValue);
          return;
        }
        onChange(e);
      }

      function handleSubmit(e) {
        onOpen(new Utils.Event({ value: false }));
        onChange(new Utils.Event({ value: valueBeforeSubmit }, e));
      }

      function handleReset() {
        if (!props.required && !props.readOnly) setValueBeforeSubmit([]);
      }

      function getItemListLength() {
        if (!multilevel) return sortedItemList.length;

        const currLevel = level[level.length - 1];

        if (!currLevel) {
          return sortedItemList.filter((item) => !item.parent).length;
        }

        // We need to raise filtered itemList length by 1 because of category
        return sortedItemList.filter((item) => item.parent?.value === currLevel).length + 1;
      }
      //@@viewOff:private

      //@@viewOn:interface
      //@@viewOff:interface

      //@@viewOn:render
      return (
        <Input
          {...otherProps}
          itemList={sortedItemList}
          displayedValue={value}
          value={valueBeforeSubmit}
          onChange={handleChange}
          elementRef={Utils.Component.combineRefs(elementRef, inputBoxRef)}
          pickerProps={{
            itemListLength: getItemListLength(),
            footer: multiple ? <InputSelectControls onSubmit={handleSubmit} onReset={handleReset} /> : undefined,
          }}
        />
      );
      //@@viewOff:render
    },
  });
}

//@@viewOn:exports
export { withSelectBottomSheet };
export default withSelectBottomSheet;
//@@viewOff:exports
