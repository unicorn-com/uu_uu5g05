//@@viewOn:imports
import { createComponent, Lsi, useWillMount, Utils } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Uu5Forms from "uu5g05-forms";
import Config from "../config/config.js";
import importLsi from "../lsi/import-lsi.js";
//@@viewOff:imports

//@@viewOn:constants
//@@viewOff:constants

//@@viewOn:css
const Css = {
  message: () => Config.Css.css({ marginTop: Uu5Elements.UuGds.SpacingPalette.getValue(["fixed", "b"]) }),
};
//@@viewOff:css

//@@viewOn:helpers
//@@viewOff:helpers

function withDefaultProps(Component, uu5Tag, labelPath, defaultProps = {}, messagePath) {
  return createComponent({
    //@@viewOn:statics
    uu5Tag: Config.TAG + `withDefaultProps(${uu5Tag})`,
    //@@viewOff:statics

    //@@viewOn:propTypes
    propTypes: {
      ...Component.propTypes,
    },
    //@@viewOff:propTypes

    //@@viewOn:defaultProps
    defaultProps: {
      ...Component.defaultProps,
    },
    //@@viewOff:defaultProps

    render(props) {
      //@@viewOn:private
      const { label: propsLabel, ...otherProps } = props;
      const label = propsLabel ?? <Lsi import={importLsi} path={labelPath} />;

      let propsToPass = { ...otherProps };
      if (Object.keys(defaultProps).length > 0) {
        for (let prop in defaultProps) {
          let componentPropValue = otherProps[prop];
          if (!componentPropValue || (Array.isArray(componentPropValue) && componentPropValue.length === 0)) {
            propsToPass = { ...propsToPass, [prop]: defaultProps[prop] };
          }
        }
      }

      if (defaultProps.itemList && defaultProps.disableUserItemList) {
        propsToPass = { ...propsToPass, itemList: defaultProps.itemList };
      }

      if (process.env.NODE_ENV !== "production") {
        useWillMount(() => {
          let modifiedUu5Tag = "Form" + uu5Tag.slice(0, uu5Tag.length - 5);
          Utils.LoggerFactory.get(Config.TAG + modifiedUu5Tag).error(
            `WARNING: This component is deprecated. It is recommended to use components from Uu5Editing instead. (https://uuapp.plus4u.net/uu-bookkit-maing01/5ee03d6a2be14b9f8d6e138b3ed3d250)`,
          );
        });
      }
      //@@viewOff:private

      //@@viewOn:interface
      //@@viewOff:interface

      //@@viewOn:render
      return (
        <>
          <Component {...propsToPass} label={label} />
          {messagePath && (
            <Uu5Forms.Message className={Css.message()} size="s">
              <Lsi import={importLsi} path={messagePath} />
            </Uu5Forms.Message>
          )}
        </>
      );
      //@@viewOn:render
    },
  });
}

//@@viewOn:exports
export { withDefaultProps };
export default withDefaultProps;
//@@viewOff:exports
