//@@viewOn:imports
import { createVisualComponent, PropTypes, Lsi } from "uu5g05";
import Uu5Forms from "uu5g05-forms";
import Config from "../../config/config";
import importLsi from "../../lsi/import-lsi.js";
//@@viewOff:imports

/* TODO komponenta je napsana spatne a ani neni specifikovano od UX, jak bude komponenta vypadat (Jakub Šírek dodá)
 *   Urcite tady budou hodnoty z gds spacingu */

//@@viewOn:constants
const SORTED_VALUES = ["top", "right", "bottom", "left"];
//@@viewOff:constants

//@@viewOn:css
//@@viewOff:css

//@@viewOn:helpers
//@@viewOff:helpers

const Margin = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Margin",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    switchSelectProps: PropTypes.shape({ ...Uu5Forms.SwitchSelect.PropTypes }),
    numberProps: PropTypes.shape({ ...Number.PropTypes }),
    valueList: PropTypes.arrayOf(PropTypes.string),
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    valueList: SORTED_VALUES,
    switchSelectProps: {},
    numberProps: {
      step: 1,
    },
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const {
      valueList,
      switchSelectProps,
      numberProps: { step = Margin.defaultProps.numberProps.step, ...numberProps },
      label = <Lsi import={importLsi} path={["FormMargin", "label"]} />,
      message,
      feedback,
      onChange, // TODO necessary to use
      value, // TODO necessary to use
    } = props;

    const itemList = (valueList ? SORTED_VALUES.filter((v) => valueList.includes(v)) : SORTED_VALUES).map((v) => ({
      value: v,
    }));
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      <>
        <Uu5Forms.SwitchSelect {...switchSelectProps} itemList={itemList} label={label} feedback={feedback} />
        <Uu5Forms.Number {...numberProps} step={step} message={message} feedback={feedback} />
      </>
    );
    //@@viewOff:render
  },
});

export { Margin };
export default Margin;
