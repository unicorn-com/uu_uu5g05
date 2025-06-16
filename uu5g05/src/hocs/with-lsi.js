//@@viewOn:imports
import createComponent from "../create-component/create-component.js";
import PropTypes from "../prop-types.js";
import Config from "../config/config.js";
import UtilsComponent from "../utils/component.js";
import Lsi from "../components/lsi.js";
//@@viewOff:imports

const LsiValues = createComponent({
  uu5Tag: Config.TAG + "LsiValues",

  render({ lsiList, children }) {
    const [lsiData, ...restLsiList] = lsiList;
    return (
      <Lsi lsi={lsiData[1]}>
        {({ value }) => {
          const result = { [lsiData[0]]: value };
          return restLsiList.length ? (
            <LsiValues lsiList={restLsiList}>{(data) => children({ ...result, ...data })}</LsiValues>
          ) : (
            children(result)
          );
        }}
      </Lsi>
    );
  },
});

function withLsi(Component, propList) {
  const Comp = createComponent({
    //@@viewOn:statics
    uu5Tag: Config.TAG + `withLsi(${Component.uu5Tag || ""})`,
    //@@viewOff:statics

    //@@viewOn:propTypes
    propTypes: {
      ...Component.propTypes,
      ...Object.fromEntries(propList.map((prop) => [prop, PropTypes.lsi])),
    },
    //@@viewOff:propTypes

    //@@viewOn:defaultProps
    defaultProps: {
      ...Component.defaultProps,
      ...Object.fromEntries(propList.map((prop) => [prop, undefined])),
    },
    //@@viewOff:defaultProps

    render(props) {
      //@@viewOn:private
      const lsiValues = {};
      propList.forEach((prop) => {
        const value = props[prop];
        if (value && typeof value === "object") lsiValues[prop] = value;
      });
      //@@viewOff:private

      //@@viewOn:interface
      //@@viewOff:interface

      //@@viewOn:render
      let component;

      if (Object.keys(lsiValues).length > 0) {
        component = (
          <LsiValues lsiList={Object.entries(lsiValues)}>
            {(lsiProps) => <Component {...props} {...lsiProps} />}
          </LsiValues>
        );
      } else {
        component = <Component {...props} />;
      }

      return component;
      //@@viewOff:render
    },
  });

  UtilsComponent.mergeStatics(Comp, Component);

  return Comp;
}

export { withLsi };
export default withLsi;
