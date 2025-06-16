//@@viewOn:imports
import { createHoc } from "uu5g05";
import withExtensionInput from "./with-extension-input.js";
import withFormInput from "./with-form-input.js";
import RadiosInput from "./inputs/radios-input.js";
//@@viewOff:imports

const _Radios = withExtensionInput(RadiosInput, { extensionPosition: "top" });

const { iconLeft, onIconLeftClick, iconRight, onIconRightClick, iconRightList, prefix, suffix, ...propTypes } =
  _Radios.propTypes;
const {
  iconLeft: _a,
  onIconLeftClick: _b,
  iconRight: _c,
  onIconRightClick: _d,
  iconRightList: _e,
  prefix: _f,
  suffix: _g,
  ...defaultProps
} = _Radios.defaultProps;

const Radios = withFormInput(
  createHoc({
    propTypes,
    defaultProps,
    component: _Radios,
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

Radios.Input = RadiosInput;

//@@viewOn:helpers
//@@viewOff:helpers

export { Radios };
export default Radios;
