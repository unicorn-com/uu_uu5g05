//@@viewOn:imports
import { useRef, useMemo, useCallback } from "../hooks/react-hooks.js";
import useRoute from "../hooks/use-route.js";
import UrlParams from "./url-params.js";
//@@viewOff:imports

//@@viewOn:helpers
function filterParamsByDenyOrAllowSet(params, denySet, allowSet) {
  let result = {};

  if (allowSet) {
    for (let key in params) {
      if (allowSet.has(key)) {
        result[key] = params[key];
      }
    }
  } else {
    for (let key in params) {
      if (!denySet.has(key)) {
        result[key] = params[key];
      }
    }
  }

  return result;
}
//@@viewOff:helpers

function useRouteParamsProvider({
  componentProps = {},
  routeParamsPrefix,
  types = {},
  routeParamsDenyList = [],
  routeParamsAllowList,
}) {
  const [route, setRoute] = useRoute();

  const routeParams = useMemo(() => {
    return UrlParams.deserializeParams(route.params, types, routeParamsPrefix);
  }, [route.params, routeParamsPrefix, types]);

  const initComponentPropsRef = useRef(componentProps);
  const isUsingAllowSet = Array.isArray(routeParamsAllowList);
  const paramAllowSetRef = useRef(new Set(isUsingAllowSet ? routeParamsAllowList : []));
  const paramDenySetRef = useRef(new Set(routeParamsDenyList));
  const activeParamsRef = useRef({});

  const params = useMemo(() => {
    // Update paramDenySet
    for (let key in routeParams) {
      if (Object.hasOwn(componentProps, key)) {
        if (!Object.is(componentProps[key], initComponentPropsRef.current[key])) {
          paramDenySetRef.current.add(key);
          paramAllowSetRef.current.delete(key);
        }
      }
    }

    // Compute new activeParams
    const newActiveParams = filterParamsByDenyOrAllowSet(
      routeParams,
      isUsingAllowSet ? undefined : paramDenySetRef.current,
      isUsingAllowSet ? paramAllowSetRef.current : undefined,
    );

    // We need to reuse previous activeParams instance if there is no change.
    // It is important to have same references because of React.memo, useMemo or useCallback.
    if (!UrlParams.areEqual(activeParamsRef.current, newActiveParams)) {
      activeParamsRef.current = newActiveParams;
    }

    return activeParamsRef.current;
  }, [routeParams, isUsingAllowSet, componentProps]);

  const setParams = useCallback(
    (paramsOrUpdaterFn, options = {}) => {
      if (typeof paramsOrUpdaterFn === "function" || !UrlParams.areEqual(paramsOrUpdaterFn, routeParams)) {
        setRoute((setRouteArgs) => {
          let prevUu5Route, prevParams, prevFragment, prevOptions;
          if (setRouteArgs && typeof setRouteArgs === "object") {
            ({
              uu5Route: prevUu5Route,
              params: prevParams,
              fragment: prevFragment,
              options: prevOptions,
            } = setRouteArgs);
          } else {
            // this could happen with uu5g04 Router
            prevUu5Route = route.uu5Route;
            prevParams = route.params;
            prevFragment = route.fragment;
            prevOptions = {};
          }
          let defaultOptions = { replace: true };
          let params;
          if (typeof paramsOrUpdaterFn === "function") {
            params = UrlParams.deserializeParams(prevParams, types, routeParamsPrefix);
            options = { ...defaultOptions, ...prevOptions };
            ({ options, params } = paramsOrUpdaterFn({ options, params }));
          } else {
            params = paramsOrUpdaterFn;
            options = { ...defaultOptions, ...options };
          }
          // if several calls were merged into single render and any of them contained `replace: false`,
          // a new history entry should be written (regardless of what other calls were using)
          if (prevOptions?.replace === false) {
            options.replace = false;
          }
          const filteredParams = filterParamsByDenyOrAllowSet(
            params,
            isUsingAllowSet ? undefined : paramDenySetRef.current,
            isUsingAllowSet ? paramAllowSetRef.current : undefined,
          );
          const newRouteParams = UrlParams.serializeParams(filteredParams, routeParamsPrefix, prevParams);
          return {
            uu5Route: prevUu5Route,
            params: newRouteParams,
            fragment: options.replace ? prevFragment : undefined,
            options: options,
          };
        });
      }
    },
    [isUsingAllowSet, route.fragment, route.params, route.uu5Route, routeParams, routeParamsPrefix, setRoute, types],
  );

  return useMemo(() => ({ params, setParams }), [params, setParams]);
}

//@@viewOn:exports
export { useRouteParamsProvider };
export default useRouteParamsProvider;
//@@viewOff:exports
