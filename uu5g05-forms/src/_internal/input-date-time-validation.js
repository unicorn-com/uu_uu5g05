//@@viewOn:imports
import { createVisualComponent } from "uu5g05";
import Config from "../config/config.js";
import useValidatorMap from "../use-validator-map.js";
import withValidationInput from "../with-validation-input.js";
import { InputDateTime, getStepModulo } from "./input-date-time.js";
import TimeStepMessage from "./time-step-message.js";
//@@viewOff:imports

const ValidationInput = withValidationInput(InputDateTime);

const InputDateTimeValidation = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "InputDateTimeValidation",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: ValidationInput.propTypes,
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: ValidationInput.defaultProps,
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { min, max, timeZone, step, required } = props;

    const onValidate = useValidatorMap(props, {
      step: (value) => {
        if (step == null || value == null) return true;
        let stepModulo = getStepModulo(value, timeZone, min, step, true);
        return stepModulo === 0 ? true : { messageParams: [step, <TimeStepMessage key="timeStep" step={step} />] };
      },
      max: (value) => !max || !value || new Date(value) <= new Date(max),
      min: (value) => !min || !value || new Date(value) >= new Date(min),
      badValue: (value) => {
        return value !== null;
      },
      required: (value) => {
        return !required || (value != null && value !== "");
      },
    });
    //@@viewOff:private

    //@@viewOn:render
    return <ValidationInput {...props} onValidate={onValidate} />;
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { InputDateTimeValidation };
export default InputDateTimeValidation;
//@@viewOff:exports
