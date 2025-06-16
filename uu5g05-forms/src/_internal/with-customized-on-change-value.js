//@@viewOn:imports
import { Utils, createComponent } from "uu5g05";
//@@viewOff:imports

//@@viewOn:constants
//@@viewOff:constants

//@@viewOn:helpers
//@@viewOff:helpers

function withCustomizedOnChangeValue(Component, onChangeCustomizeValue) {
  const ResultComponent = createComponent({
    //@@viewOn:statics
    uu5Tag: `withCustomizedOnChangeValue(${Component.uu5Tag})`,
    //@@viewOff:statics

    //@@viewOn:propTypes
    propTypes: Component.propTypes,
    //@@viewOff:propTypes

    //@@viewOn:defaultProps
    defaultProps: Component.defaultProps,
    //@@viewOff:defaultProps

    render(props) {
      //@@viewOn:private
      const { onChange, ...otherProps } = props;

      const handleChange =
        typeof onChange === "function"
          ? (e) => {
              e.data.value = onChangeCustomizeValue(e.data.value);
              onChange(e);
            }
          : undefined;
      //@@viewOff:private

      //@@viewOn:render
      return <Component {...otherProps} onChange={handleChange} />;
      //@@viewOff:render
    },
  });

  Utils.Component.mergeStatics(ResultComponent, Component);
  return ResultComponent;
}

export { withCustomizedOnChangeValue };
export default withCustomizedOnChangeValue;
