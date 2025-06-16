//@@viewOn:imports
import { createHoc } from "uu5g05";
import withExtensionInput from "./with-extension-input.js";
import withFormInput from "./with-form-input.js";
import CheckboxesInput from "./inputs/checkboxes-input.js";
//@@viewOff:imports

const _Checkboxes = withExtensionInput(CheckboxesInput, { extensionPosition: "top" });

const { iconLeft, onIconLeftClick, iconRight, onIconRightClick, iconRightList, prefix, suffix, ...propTypes } =
  _Checkboxes.propTypes;
const {
  iconLeft: _a,
  onIconLeftClick: _b,
  iconRight: _c,
  onIconRightClick: _d,
  iconRightList: _e,
  prefix: _f,
  suffix: _g,
  ...defaultProps
} = _Checkboxes.defaultProps;

const Checkboxes = withFormInput(
  createHoc({
    propTypes,
    defaultProps,
    component: _Checkboxes,
    getProps({
      iconLeft,
      onIconLeftClick,
      iconRight,
      onIconRightClick,
      iconRightList,
      prefix,
      suffix,
      feedback,
      pending,
      onFeedbackClick,
      ...props
    }) {
      return { ...props, _feedback: feedback, _pending: pending, _onFeedbackClick: onFeedbackClick };
    },
  }),
);

Checkboxes.Input = CheckboxesInput;

//@@viewOn:helpers
//@@viewOff:helpers

export { Checkboxes };
export default Checkboxes;
