//@@viewOn:imports
import SliderInput from "./inputs/slider-input.js";
import withFormInput from "./with-form-input.js";
//@@viewOff:imports

const Slider = withFormInput(SliderInput);
Slider.Input = SliderInput;

//@@viewOn:helpers
//@@viewOff:helpers

export { Slider };
export default Slider;
