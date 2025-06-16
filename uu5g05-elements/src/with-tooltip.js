//@@viewOn:imports
import { createComponent, PropTypes, Utils, Lsi } from "uu5g05";
import Config from "./config/config.js";

//@@viewOff:imports

function withTooltip(Component) {
  const Comp = createComponent({
    //@@viewOn:statics
    uu5Tag: Config.TAG + `withTooltip(${Component.uu5Tag || ""})`,
    //@@viewOff:statics

    //@@viewOn:propTypes
    propTypes: {
      ...Component.propTypes,
      tooltip: PropTypes.lsi,
    },
    //@@viewOff:propTypes

    //@@viewOn:defaultProps
    defaultProps: {
      ...Component.defaultProps,
      tooltip: undefined,
    },
    //@@viewOff:defaultProps

    render(props) {
      //@@viewOn:private
      const { tooltip } = props;
      //@@viewOff:private

      //@@viewOn:interface
      //@@viewOff:interface

      //@@viewOn:render
      let component;

      if (tooltip && typeof tooltip === "object") {
        component = (
          <Lsi lsi={tooltip}>
            {({ value }) => (
              <Component {...props} tooltip={value} elementAttrs={{ ...props.elementAttrs, title: value }} />
            )}
          </Lsi>
        );
      } else if (tooltip) {
        component = <Component {...props} elementAttrs={{ ...props.elementAttrs, title: tooltip }} />;
      } else {
        component = <Component {...props} />;
      }

      return component;
      //@@viewOff:render
    },
  });

  Utils.Component.mergeStatics(Comp, Component);

  return Comp;
}

export { withTooltip };
export default withTooltip;
