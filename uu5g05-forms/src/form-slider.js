//@@viewOn:imports
import Slider from "./slider.js";
import withFormItem from "./with-form-item.js";
//@@viewOff:imports

const _FormSlider = withFormItem(Slider);

function FormSlider(props) {
  const { initialValue: propsInitialValue, min: propsMin, itemList } = props;
  let min = propsMin ?? 0;
  let initialValue = propsInitialValue ?? min;
  if (
    Array.isArray(itemList) &&
    itemList.length > 0 &&
    itemList.findIndex((item) => typeof item.value === "string") > -1
  ) {
    if (!propsInitialValue) {
      initialValue = itemList[min].value;
    }
  }
  return <_FormSlider {...props} initialValue={initialValue} />;
}

//@@viewOn:helpers
//@@viewOff:helpers

export { FormSlider };
export default FormSlider;
