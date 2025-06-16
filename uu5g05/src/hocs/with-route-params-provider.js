//@@viewOn:imports
import { useMemo } from "../hooks/react-hooks.js";
import PropTypes from "../prop-types.js";
import useRouteParamsProvider from "../_internal/use-route-params-provider.js";
import Context from "../contexts/route-params-context.js";
import createComponent from "../create-component/create-component.js";
import UtilsComponent from "../utils/component.js";
import UtilsNestingLevel from "../utils/nesting-level.js";
//@@viewOff:imports

//@@viewOn:helpers
function areRouteParamsDisabled(props, Component) {
  let fallbackNestingLevel =
    !Component.nestingLevel || (Component.nestingLevel.length === 1 && Component.nestingLevel[0] === "route")
      ? "route"
      : undefined;
  const currentNestingLevel = UtilsNestingLevel.getNestingLevel(
    { ...props, nestingLevel: props.nestingLevel !== undefined ? props.nestingLevel : fallbackNestingLevel },
    Component,
  );

  if (currentNestingLevel !== "route" && !props.routeParamsPrefix) {
    return true;
  } else {
    return false;
  }
}

function RouteParamsProvider({
  componentProps,
  routeParamsPrefix,
  types,
  routeParamsDenyList,
  routeParamsAllowList,
  children,
}) {
  const value = useRouteParamsProvider({
    componentProps,
    routeParamsPrefix,
    types,
    routeParamsDenyList,
    routeParamsAllowList,
  });

  return (
    <Context.Provider value={value}>{typeof children === "function" ? children(value) : children}</Context.Provider>
  );
}

function EmptyProvider({ children }) {
  const value = useMemo(() => ({ setParams: () => {} }), []);

  return (
    <Context.Provider value={value}>{typeof children === "function" ? children(value) : children}</Context.Provider>
  );
}
//@@viewOff:helpers

function withRouteParamsProvider(Component, types) {
  const ResultComponent = createComponent({
    //@@viewOn:statics
    uu5Tag: `withRouteParamsProvider(${Component.uu5Tag})`,
    //@@viewOff:statics

    //@@viewOn:propTypes
    propTypes: {
      ...Component.propTypes,
      routeParamsDisabled: PropTypes.bool,
      routeParamsPrefix: PropTypes.string,
      routeParamsDenyList: PropTypes.arrayOf(PropTypes.string),
      routeParamsAllowList: PropTypes.arrayOf(PropTypes.string),
    },
    //@@viewOff:propTypes

    //@@viewOn:defaultProps
    defaultProps: {
      ...Component.defaultProps,
    },
    //@@viewOff:defaultProps

    render(props) {
      //@@viewOn:private
      const {
        routeParamsDisabled = areRouteParamsDisabled(props, Component),
        routeParamsPrefix,
        routeParamsBlackList, // deprecated; for backward-compatibility only
        routeParamsDenyList = routeParamsBlackList,
        routeParamsAllowList,
        ...propsToPass
      } = props;
      //@@viewOff:private

      //@@viewOn:render
      let Provider;

      if (routeParamsDisabled) {
        Provider = EmptyProvider;
      } else {
        Provider = RouteParamsProvider;
      }

      return (
        <Provider
          componentProps={props}
          routeParamsPrefix={routeParamsPrefix}
          types={types}
          routeParamsDenyList={routeParamsDenyList}
          routeParamsAllowList={routeParamsAllowList}
        >
          {({ params }) => <Component {...propsToPass} {...params} />}
        </Provider>
      );
      //@@viewOff:render
    },
  });
  UtilsComponent.mergeStatics(ResultComponent, Component);

  return ResultComponent;
}

//@@viewOn:exports
export { withRouteParamsProvider };
export default withRouteParamsProvider;
//@@viewOff:exports
