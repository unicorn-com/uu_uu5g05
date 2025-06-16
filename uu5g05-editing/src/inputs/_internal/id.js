//@@viewOn:imports
import { createVisualComponent, Lsi, useWillMount, Utils } from "uu5g05";
import Uu5Forms from "uu5g05-forms";
import Config from "../../config/config";
import importLsi from "../../lsi/import-lsi.js";
//@@viewOff:imports

//@@viewOn:constants
const REGEXP = "^[a-zA-Z0-9_-]*$";
//@@viewOff:constants

//@@viewOn:css
//@@viewOff:css

//@@viewOn:helpers
//@@viewOff:helpers

const Id = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Id",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...Uu5Forms.Text.propTypes,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    ...Uu5Forms.Text.defaultProps,
    label: <Lsi import={importLsi} path={["FormId", "label"]} />,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    if (process.env.NODE_ENV !== "production") {
      useWillMount(() => {
        Utils.LoggerFactory.get(Config.TAG + "FormId").error(
          `WARNING: This component is deprecated. It is recommended to use components from Uu5Editing instead. (https://uuapp.plus4u.net/uu-bookkit-maing01/5ee03d6a2be14b9f8d6e138b3ed3d250)`,
        );
      });
    }
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return <Uu5Forms.Text {...props} pattern={REGEXP} />;
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { Id };
export default Id;
//@@viewOff:exports
