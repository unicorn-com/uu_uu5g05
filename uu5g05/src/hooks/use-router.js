import { useLayoutEffect, useMemo } from "./react-hooks.js";
import useRoute from "./use-route.js";
import Element from "../utils/element.js";

function useRouter(routeMap) {
  let [route, setRoute] = useRoute();

  let uu5Route;
  let params;
  let fragment;
  let prevRoute;
  let component;
  let pendingSetRouteArgs;
  if (routeMap && typeof routeMap === "object") {
    ({ uu5Route, params, fragment, component, prevRoute } = route);
    if (uu5Route == null) uu5Route = "";
    // NOTE We're computing redirects directly, not in effect as it was before (to have non-interrupted initial
    // loading animations in uuApps).
    // TODO There is still 1 issue: user goes to "/", RouteProvider provides "/", useRouter finds out it's
    // redirect to "/home" so renders Home component and in effect it does setRoute("/home") to update RouteProvider,
    // i.e. if Home component was using useRoute(), it would get "/" in 1st render (which would be right away corrected
    // to "/home" in 2nd render).
    // Also note that similar issue existed when redirects were done in effect - e.g. leaving from "/about" to "/",
    // RouteProvider provides "/", useRouter wanted to redirect to "/home" so it rendered previous result, i.e. About,
    // and updated route in effect; so About was getting route "/" just before it got unmounted.
    let settings = getRouteSettingsAfterRedirectsAndRewrites(uu5Route, routeMap);
    let { skipHistory, uu5Route: redirectedUu5Route } = settings;
    if (component == null) component = settings.component;
    if (redirectedUu5Route != null) uu5Route = redirectedUu5Route;
    if (skipHistory || redirectedUu5Route != null) {
      // NOTE (not a performance issue) After executing setRoute(...), RouteProvider's context value won't change because it
      // doesn't contain "skipHistory" field and is optimized not to change its instance if not needed.
      pendingSetRouteArgs = [uu5Route, params, fragment, { component: route.component, skipHistory, replace: true }];
    }
  }

  useLayoutEffect(() => {
    if (pendingSetRouteArgs) setRoute(...pendingSetRouteArgs);
  }, [pendingSetRouteArgs, setRoute]);

  let result = useMemo(() => {
    let result;
    let props = { uu5Route, params, fragment, prevRoute };
    if (Element.isValid(component)) {
      if (typeof component.type !== "string") result = Element.clone(component, props);
      else result = component;
    } else if (typeof component === "function") {
      result = component(props);
    }
    return result ?? null;
  }, [component, fragment, params, prevRoute, uu5Route]);

  return result;
}

function getRouteSettings(uu5Route, routeMap) {
  let result;
  let settings = uu5Route in routeMap ? routeMap[uu5Route] : routeMap["*"];
  if (typeof settings === "function") result = { component: settings };
  else if (Element.isValid(settings)) result = { component: settings };
  else if (settings == null || typeof settings !== "object") result = { component: settings };
  else result = settings;
  return result;
}

function getRouteSettingsAfterRedirectsAndRewrites(uu5Route, routeMap) {
  let chain = [uu5Route];
  let settings = getRouteSettings(uu5Route, routeMap);
  while (settings?.rewrite != null || settings?.redirect != null) {
    let { rewrite, redirect, ...rest } = settings;
    let nextInChain = rewrite ?? redirect;
    chain.push(nextInChain);
    if (chain.indexOf(nextInChain) < chain.length - 1) {
      throw new Error("Cyclic rewrite/redirect chain detected in routeMap: " + chain.join(" -> "));
    }
    if (settings.rewrite != null) {
      settings = { ...getRouteSettings(settings.rewrite, routeMap), ...rest };
    } else if (settings.redirect != null) {
      settings = { ...getRouteSettings(settings.redirect, routeMap), uu5Route: settings.redirect }; // don't include "...rest"
    }
  }
  return settings;
}

export { useRouter };
export default useRouter;
