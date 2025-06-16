//@@viewOn:imports
import { createComponent, Utils, Lsi, PropTypes } from "uu5g05";
import { UuGds } from "uu5g05-elements";
import Uu5Forms from "uu5g05-forms";
import Config from "../../config/config.js";
import importLsi from "../../lsi/import-lsi.js";
//@@viewOff:imports

const Css = {
  main() {
    return Config.Css.css({
      display: "flex",
      justifyContent: "flex-end",
      gap: UuGds.getValue(["SpacingPalette", "fixed", "c"]),
    });
  },
};

//@@viewOn:helpers
//@@viewOff:helpers

const ModalFooter = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "ModalFooter",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    onCancel: PropTypes.func.isRequired,
    lsiRoot: PropTypes.string.isRequired,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { onCancel, lsiRoot } = props;
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const attrs = Utils.VisualComponent.getAttrs(props, Css.main());

    return (
      <div {...attrs}>
        <Uu5Forms.CancelButton onClick={onCancel}>
          <Lsi import={importLsi} path={[lsiRoot, "cancel"]} />
        </Uu5Forms.CancelButton>
        <Uu5Forms.SubmitButton>
          <Lsi import={importLsi} path={[lsiRoot, "confirm"]} />
        </Uu5Forms.SubmitButton>
      </div>
    );
    //@@viewOff:render
  },
});

export { ModalFooter };
export default ModalFooter;
