//@@viewOn:imports
import { createComponent } from "uu5g05";
import withFormInput from "./with-form-input.js";
import LsiInput from "./inputs/lsi-input.js";
//@@viewOff:imports

const Lsi = withRequired(withFormInput(LsiInput));
Lsi.Input = LsiInput;

//@@viewOn:helpers
function withRequired(Component) {
  return createComponent({
    //@@viewOn:statics
    uu5Tag: `withRequired(${Component.uu5Tag})`,
    //@@viewOff:statics

    //@@viewOn:propTypes
    propTypes: { ...Component.propTypes },
    //@@viewOff:propTypes

    //@@viewOn:defaultProps
    defaultProps: { ...Component.defaultProps },
    //@@viewOff:defaultProps

    render(props) {
      //@@viewOn:private
      const compProps = {};
      if (!props.required) {
        const atLeastOneRequiredItem = props.languageList?.some((it) => it.required);
        if (atLeastOneRequiredItem) {
          //Note: Force required prop for withFormInput HoC and pass internal _forceRequiredLanguage prop to LsiInput for further evaluation.
          compProps.required = true;
          compProps._forceRequiredLanguage = true;
        }
      }
      //@@viewOff:private

      //@@viewOn:render
      return <Component {...props} {...compProps} />;
      //@@viewOff:render
    },
  });
}
//@@viewOff:helpers

export { Lsi };
export default Lsi;
