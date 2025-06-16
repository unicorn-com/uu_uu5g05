//@@viewOn:imports
import { createComponent, PropTypes, Lsi, useWillMount, Utils } from "uu5g05";
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

function withAvailableValues(Component, uu5Tag, labelPath, availableValues, messagePath, isCapitalFirstLetter) {
  const { itemList, ...ComponentPropTypes } = Component.propTypes;
  const { itemList: _itemList, ...ComponentDefaultProps } = Component.defaultProps;
  return createComponent({
    //@@viewOn:statics
    uu5Tag: Config.TAG + `withAvailableValues(${uu5Tag})`,
    //@@viewOff:statics

    //@@viewOn:propTypes
    propTypes: {
      ...ComponentPropTypes,
      valueList: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
      displayAuto: PropTypes.bool,
    },
    //@@viewOff:propTypes

    //@@viewOn:defaultProps
    defaultProps: {
      ...ComponentDefaultProps,
      displayAuto: true,
    },
    //@@viewOff:defaultProps

    render(props) {
      //@@viewOn:private
      const { valueList, label: propsLabel, displayAuto, ...otherProps } = props;
      const label = propsLabel ?? <Lsi import={importLsi} path={labelPath} />;
      const filteredAvailableValues = displayAuto
        ? availableValues
        : availableValues.filter((value) => value !== undefined);

      const itemList = (
        valueList
          ? filteredAvailableValues.filter((v) =>
              typeof v === "object" ? valueList.includes(v.value) : valueList.includes(v),
            )
          : filteredAvailableValues
      ).map((v) =>
        typeof v === "object"
          ? v
          : {
              value: v,
              children: v === undefined ? "Auto" : isCapitalFirstLetter ? v.charAt(0).toUpperCase() + v.slice(1) : v,
            },
      );

      if (process.env.NODE_ENV !== "production") {
        useWillMount(() => {
          let modifiedUu5Tag = "Form" + uu5Tag.slice(0, uu5Tag.length - 5);
          Utils.LoggerFactory.get(Config.TAG + modifiedUu5Tag).error(
            `WARNING: This component is deprecated. It is recommended to use components from Uu5Editing instead. (https://uuapp.plus4u.net/uu-bookkit-maing01/5ee03d6a2be14b9f8d6e138b3ed3d250)`,
          );
        });
      }
      //@@viewOn:interface
      //@@viewOff:interface

      //@@viewOn:render
      return (
        <>
          <Component {...otherProps} label={label} itemList={itemList} disableOptionReorder />
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
export { withAvailableValues };
export default withAvailableValues;
//@@viewOff:exports
