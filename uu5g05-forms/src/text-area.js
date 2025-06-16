//@@viewOn:imports
import { createComponent, useDevice, Utils } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "./config/config.js";
import withExtensionInput from "./with-extension-input.js";
import withFormInput from "./with-form-input.js";
import TextAreaInput from "./inputs/text-area-input.js";

//@@viewOff:imports

const CONTAINER_SIZE_MAP_MOBILE = Uu5Elements.Input._CONTAINER_SIZE_MAP_MOBILE;

function getHeight(size) {
  const { h } = Uu5Elements.UuGds.getValue(["SizingPalette", "spot", "basic", size]);
  return 3 * h + 8;
}

const _TextAreaInput = createComponent({
  uu5Tag: Config.TAG + "TextArea.Input",
  propTypes: TextAreaInput.propTypes,
  defaultProps: TextAreaInput.defaultProps,
  render({ className, ...otherProps }) {
    const { size = "m", autoResize, rows } = otherProps;

    const { isMobileOrTablet } = useDevice();
    const containerSize = (isMobileOrTablet && CONTAINER_SIZE_MAP_MOBILE[size]) || size;

    let heightClassName;
    if (!autoResize && !rows) {
      heightClassName = Config.Css.css({ height: getHeight(containerSize) });
    }

    return <TextAreaInput {...otherProps} className={Utils.Css.joinClassName(className, heightClassName)} />;
  },
});

const TextArea = withFormInput(withExtensionInput(_TextAreaInput, { extensionPosition: "top" }));
TextArea.Input = TextAreaInput;

//@@viewOn:helpers
//@@viewOff:helpers

export { TextArea, getHeight };
export default TextArea;
