/**
 * Copyright (C) 2020 Unicorn a.s.
 *
 * This program is free software; you can use it under the terms of the UAF Open License v01 or
 * any later version. The text of the license is available in the file LICENSE or at www.unicorn.com.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even
 * the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See LICENSE for more details.
 *
 * You may contact Unicorn a.s. at address: V Kapslovne 2767/2, Praha 3, Czech Republic or
 * at the email: info@unicorn.com.
 */

//@@viewOn:imports
import { useEffect, useLayoutEffect, useMemo, useCallback, useReducer, useRef } from "../hooks/react-hooks.js";
import createComponent from "../create-component/create-component.js";
import PropTypes from "../prop-types.js";
import Config from "../config/config.js";
import RouteContext from "../contexts/route-context.js";
import RouteLeaveContext from "../contexts/route-leave-context.js";
import RouteBackContext from "../contexts/route-back-context.js";
import { appBaseUri } from "../uu5-environment.js";
import UtilsDom from "../utils/dom.js";
import useEvent from "../hooks/use-event.js";
import useMemoObject from "../hooks/use-memo-object.js";
//@@viewOff:imports

//@@viewOn:constants
// after getting to new route, try to apply remembered scroll position immediately / or after every SCROLL_ATTEMPT_DELAY ms
// until success or until SCROLL_MAX_TIME ms passed
const SCROLL_ATTEMPT_DELAY = 250;
const SCROLL_MAX_TIME = 5000;
//@@viewOff:constants

const RouteProvider = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "RouteProvider",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    initialRoute: PropTypes.shape({
      uu5Route: PropTypes.string,
      params: PropTypes.object,
    }),
    aliasList: PropTypes.arrayOf(PropTypes.string),
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    initialRoute: undefined,
    aliasList: undefined,
  },
  //@@viewOff:defaultProps

  render({ initialRoute, children, aliasList }) {
    //@@viewOn:private
    let [state, dispatchAction] = useReducer(routeReducer, undefined, () => {
      // initialize route from history.state or from URL
      let updateUrl = true;
      let result = initialRoute;
      if (!result) result = history?.state?.uu5Route != null ? history.state : null;
      if (!result) {
        let uu5Route;
        let uri = location.href.replace(/[?#].*/, "");
        if (uri.startsWith(appBaseUri) || uri === appBaseUri.replace(/\/+$/, "")) {
          uu5Route = uri.slice(appBaseUri.length);
        }
        let params = {};
        let url = new URL(location.href);
        for (let [key, value] of url.searchParams) params[key] = value;
        let fragment = url.hash.slice(1) || undefined;
        result = { uu5Route, params, fragment };
        updateUrl = false;
      }
      if (result !== history?.state) {
        result = { index: 0, ...result };
        let historyState = {
          uu5Route: result.uu5Route,
          params: result.params,
          fragment: result.fragment,
          skipHistory: false,
          prevRoute: null,
          index: result.index,
        };
        let args = [true, historyState, document.title];
        if (updateUrl) args.push(routeToUrl(historyState));
        historySetState(...args);
      }
      return routeReducer(null, ["init", result]);
    });

    useLayoutEffect(() => {
      // we'll restore scroll position ourselves
      history.scrollRestoration = "manual";
    }, []);

    let {
      route,
      pendingSetRoute,
      pendingHistoryRoute,
      pendingHistoryRouteNeedsRollback,
      pendingOpResult,
      pendingOpOriginalScrollTop,
      preventLeaveList,
      preventLeaveActiveId,
      preventLeaveWaitingForPopState,
      preventBackInfo,
      pendingScrollTopInfo,
    } = state;

    // apply the route from last setRoute(...) call, if possible
    // NOTE This needs to be in useLayoutEffect due to uu_plus4u5g02's RouteDataProvider which calls onLoad whenever
    // route changes and in case of redirect-s, it waits 0ms so that useEffect-s have chance to get processed (redirect-s
    // call another setRoute() in useEffect). Our implementation of setRoute() changes the state in 2 steps (1st to pending,
    // 2nd to final UC), and the change from 1st to 2nd must be done without possibility of timeout in between them => useLayoutEffect
    useLayoutEffect(() => {
      // console.log(
      //   "apply from pendingSetRoute",
      //   pendingSetRoute && (preventLeaveList.length === 0 || !preventLeaveActiveId),
      //   { pendingSetRoute, preventLeaveListLength: preventLeaveList.length, preventLeaveActiveId }
      // );
      if (pendingSetRoute && (preventLeaveList.length === 0 || !preventLeaveActiveId)) {
        let { uu5Route, params, fragment, options, scrollTop } = pendingSetRoute;
        let { replace, skipHistory, component } = options || {};

        // if we're at routeA, click on routeB which is redirect to routeC, routeC should receive
        // routeA as its prevRoute ("replace" is pretty much "redirect")
        let newPrevRoute;
        if (replace) newPrevRoute = route?.prevRoute;
        else if (route) newPrevRoute = { uu5Route: route.uu5Route, params: route.params, fragment: route.fragment };

        // remember current route's scrollTop (the one we're leaving from)
        let isReplaceState = replace || route?.skipHistory;
        if (!isReplaceState) historySetState(true, { ...history.state, scrollTop }, document.title);

        let newRouteHistoryState = {
          uu5Route,
          params,
          fragment,
          skipHistory,
          prevRoute: newPrevRoute,
          index: route.index + (isReplaceState ? 0 : 1),
        };
        let url = routeToUrl(newRouteHistoryState);
        historySetState(isReplaceState, newRouteHistoryState, document.title, url);

        let appliedRoute = { ...newRouteHistoryState, component };
        dispatchAction(["applyRoute", { route: appliedRoute }]);
      }
    }, [pendingSetRoute, preventLeaveActiveId, preventLeaveList.length, route]);

    // apply the route from last browser navigation (Back/Forward), if possible
    let ignorePopStateRef = useRef(false);
    useEffect(() => {
      // console.log(
      //   "apply from pendingHistoryRoute",
      //   pendingHistoryRoute && (preventLeaveList.length === 0 || !preventLeaveActiveId),
      //   { pendingHistoryRoute, preventLeaveListLength: preventLeaveList.length, preventLeaveActiveId, pendingOpResult }
      // );
      if (
        pendingHistoryRoute &&
        (preventLeaveList.length === 0 || !preventLeaveActiveId) &&
        pendingOpResult === "leave" &&
        !preventLeaveWaitingForPopState
      ) {
        // NOTE pendingHistoryRoute can contain scrollTop, i.e. we'll try to apply it in next effect via pendingScrollTopInfo.
        let applyRoute = () => {
          let isSingleBack = route.index - (pendingHistoryRoute.index || 0) === 1;
          if (isSingleBack && route.isPreventBackLastEntry && preventBackInfo) {
            let { component, ...newRouteHistoryState } = route;
            historySetState(false, newRouteHistoryState, document.title);
            dispatchAction(["applyRoute", { route, preserveBackInfo: true }]);
            preventBackInfo.callback();
          } else {
            dispatchAction(["applyRoute", { route: pendingHistoryRoute }]);
          }
        };
        if (pendingHistoryRouteNeedsRollback) {
          if (pendingOpOriginalScrollTop != null) {
            historySetState(true, { ...history.state, scrollTop: pendingOpOriginalScrollTop }, document.title);
          }
          // console.log(`history.go(${pendingHistoryRoute.index - route.index}; ignore next popState`);
          ignorePopStateRef.current = {
            // wait for history API / location to switch to the target history entry before switching React state to new route
            onPoppedState: () => applyRoute(),
          };
          history.go(pendingHistoryRoute.index - route.index);
        } else {
          applyRoute();
        }
      }
    }, [
      pendingHistoryRoute,
      pendingHistoryRouteNeedsRollback,
      pendingOpOriginalScrollTop,
      pendingOpResult,
      preventBackInfo,
      preventLeaveActiveId,
      preventLeaveList.length,
      preventLeaveWaitingForPopState,
      route,
    ]);

    // handle browser's Back/Forward buttons
    useLayoutEffect(() => {
      let onPopState = (event) => {
        // NOTE This event is triggerred in 2 cases:
        //   1. Back/Forward button when starting in our app and going to end up in our app.
        //   2. location.hash = "#new-fragment"; event.state === null is such case.
        // I.e. it's not triggerred if history.state didn't change (which isn't our case). However,
        // navigating in an iframe WILL change main window's history, without changing history.state.
        // TODO Therefore there's an issue that our "index" values in history.state objects might
        // be wrong. We use them so that we can preventDefault in popstate and show our custom popup.
        // Try to think of a better way, how to do that.
        // console.log("onPopState", event, "is ignoring event: ", ignorePopStateRef.current);
        let ignorePopState = ignorePopStateRef.current;
        ignorePopStateRef.current = false;
        if (ignorePopState) {
          ignorePopState.onPoppedState?.();
          return;
        }

        if (event.state) {
          let { uu5Route, index } = event.state;
          if (process.env.NODE_ENV !== "production" && uu5Route == null && index == null) {
            console.warn(
              "Modification of browser history outside of uu5g05's RouteProvider has been detected. Don't call history.replaceState() / history.pushState() directly, use RouteProvider / RouteContext / useRoute API instead. Showing confirmation dialog before leaving a route might not work properly now.",
            );
            return;
          }
          if (uu5Route != null && index != null) {
            let isSingleBack = route.index - (index || 0) === 1;
            if (isSingleBack && route.isPreventBackLastEntry && !preventBackInfo) {
              // developer called allowBack() so we called history.go(-1) and we want to simply remove route.isPreventBackLastEntry
              // and/or skipHistory flags (and don't do any preventLeave / rollback stuffs)
              // TODO Scrap forward history somehow.
              let { scrollTop, ...restoredRoute } = event.state;
              dispatchAction(["allowBackCompleted", { route: restoredRoute }]);
            } else {
              let scrollTop = (document.scrollingElement || document.body).scrollTop;
              let resultSignal = { needsRollback: false };
              UtilsDom.flushSync(() => {
                // NOTE We're forcing rollback (i.e. we're already at target history entry and we're forcing to go back
                // to the original one, not only because we might want to show leave-confirmation dialog but also because
                // we want to remember scroll position to the original entry that we left/are leaving from).
                // If we didn't want to remember scrollTop, it would be sufficient to remove sending of forceRollback and scrollTop.
                dispatchAction([
                  "browserHistoryNavigation",
                  { route: event.state, resultSignal, scrollTop, forceRollback: true },
                ]);
              });
              if (resultSignal.needsRollback) {
                // console.log(`history.go(${route.index - index}; ignore next popState`);
                history.go(route.index - index);
                ignorePopStateRef.current = {
                  onPoppedState: () => dispatchAction(["browserHistoryNavigationBackAtOriginalEntry"]),
                };
              }
            }
          }
        } else {
          // navigating to a fragment does create new history entry but we're pretty much staying where we were
          // so let's skip prevent-route handling and since we can't remove history entry, fill it with copy of current route
          let newPrevRoute = { uu5Route: route.uu5Route, params: route.params, fragment: route.fragment };
          let fragment = location.hash.slice(1) || undefined;
          let newRouteHistoryState = {
            uu5Route: route.uu5Route,
            params: route.params,
            fragment,
            skipHistory: route.skipHistory,
            prevRoute: newPrevRoute,
            index: route.index + 1,
          };
          historySetState(true, newRouteHistoryState, document.title);
          let appliedRoute = { ...newRouteHistoryState, component: route.component };
          dispatchAction(["applyRoute", { route: appliedRoute }]);
        }
      };
      window.addEventListener("popstate", onPopState);
      return () => window.removeEventListener("popstate", onPopState);
    }, [preventBackInfo, route]);

    // handle showing route-leave native notification at the right time
    useLayoutEffect(() => {
      // console.log("onBeforeUnload active:", preventLeaveList.length > 0 && !preventLeaveActiveId);
      if (preventLeaveList.length > 0 && !preventLeaveActiveId) {
        let onBeforeUnload = (event) => {
          event.preventDefault();
          event.returnValue = "";
          return event.returnValue;
        };
        window.addEventListener("beforeunload", onBeforeUnload);
        return () => window.removeEventListener("beforeunload", onBeforeUnload);
      }
    }, [preventLeaveActiveId, preventLeaveList.length]);

    // remember scroll position also when unloading document
    // NOTE Cannot use "unload" or "pagehide" events because history.replaceState() would be ignored (not persisted).
    useEvent(
      "beforeunload",
      () => {
        if (history.state) {
          let scrollTop = (document.scrollingElement || document.body).scrollTop;
          historySetState(true, { ...history.state, scrollTop }, document.title);
        }
      },
      window,
    );

    // scroll document to remembered position, e.g. when route was applied due to Forward/Back buttons
    useLayoutEffect(() => {
      if (!pendingScrollTopInfo) return;
      let { scrollTop, fragment } = pendingScrollTopInfo;
      // prefer scrollTop - user could have gone to fragment, but if he then scrolled a bit, went to another route (saved scrollTop on previous route)
      // and then went Back, he should end up on that saved scrollTop, not on fragment
      if (scrollTop != null) {
        // going back/forward to remembered scroll position => do instant scroll
        let el = document.scrollingElement || document.body;
        return repeatUntil(
          () => {
            if (el.scrollHeight - el.clientHeight >= scrollTop) {
              el.scrollTop = scrollTop;
              return true;
            }
          },
          SCROLL_MAX_TIME,
          SCROLL_ATTEMPT_DELAY,
        );
      } else {
        // going to new route / fragment => smooth scroll
        return repeatUntil(
          () => {
            let el = document.getElementById(fragment);
            if (el) {
              let elTop = el.getBoundingClientRect().top;
              let scrollContainerTop = document.scrollingElement.getBoundingClientRect().top;
              let scrollTop = elTop - scrollContainerTop - Config.LAYOUT_STICKY_HEIGHT;
              window.scrollTo({ top: scrollTop, behavior: "smooth" });
              return true;
            }
          },
          SCROLL_MAX_TIME,
          SCROLL_ATTEMPT_DELAY,
        );
      }
    }, [pendingScrollTopInfo]);

    // prepare RouteContext value
    let setRoute = useCallback(function (uu5RouteOrUpdaterFn, params, optionalFragment, options) {
      // setRoute(updaterFn)
      // setRoute(uu5Route, params, options)
      // setRoute(uu5Route, params, fragment, options)
      let fragment;
      if (optionalFragment && typeof optionalFragment === "object") {
        fragment = undefined;
        options = optionalFragment;
      } else {
        fragment = typeof optionalFragment === "string" ? optionalFragment : undefined;
      }

      let scrollTop = (document.scrollingElement || document.body).scrollTop;
      let payload = { scrollTop };
      if (typeof uu5RouteOrUpdaterFn === "function") payload.updater = uu5RouteOrUpdaterFn;
      else Object.assign(payload, { uu5Route: uu5RouteOrUpdaterFn, params, fragment, options });
      dispatchAction(["setRoute", payload]);
    }, []);
    let { uu5Route, params, fragment, component, prevRoute } = route;
    // required because reducer's "setRoute" action converts them to string (making new instance)
    // but useRouter() expects that calling the same setRoute(...currentRoute..., { skipHistory: true }) won't cause change
    // on context (or there would be rendering loop)
    params = useMemoObject(params);
    const routeCtxValue = useMemo(
      () => ({
        route: { uu5Route, params, fragment, component, prevRoute, aliasList },
        setRoute,
      }),
      [component, params, fragment, prevRoute, setRoute, uu5Route, aliasList],
    );

    // NOTE preventBack(onBackFn) allows developer to react to Back button (1 step back only) in a custom way,
    // e.g. changing internal state, etc. When it happens, we also clear forward history.
    // When preventBack gets turned on:
    // 1. do history.pushState() with current route + skipHistory: true && remember we're `preventing back`
    //    (the push must be done also because if previous history item is from different domain then we wouldn't
    //    receive popstate and wouldn't be able to prevent going back)
    // 2. a) if we popstate into route with index-1 && we're `preventing back`, we'll simply do pushState again and call onBackFn
    //    b) if we popstate into other cases then just handle it normally (e.g. show leave confirmation) and
    //       preventBackInfo will be cleared if "applyRoute" action gets ever called.
    const preventBack = useCallback((onBackFn) => {
      if (typeof onBackFn === "function") {
        dispatchAction(["preventBack", { callback: onBackFn }]);
      }
    }, []);
    const allowBack = useCallback(() => {
      dispatchAction(["allowBack"]);
    }, []);
    useEffect(() => {
      if (!preventBackInfo && route.isPreventBackLastEntry) {
        // developer called allowBack() and we're still at the extra history item => go back
        history.go(-1);
      } else if (preventBackInfo && route.isPreventBackLastEntry && !history.state?.isPreventBackLastEntry) {
        // developer called preventBack(), we updated our state (route) but didn't yet push it into browser history => push it
        let { component, ...newRouteHistoryState } = route;
        historySetState(false, newRouteHistoryState, document.title);
      }
      // eslint-disable-next-line uu5/hooks-exhaustive-deps
    }, [preventBackInfo]);

    const routeBackCtxValue = useMemo(() => ({ prevent: preventBack, allow: allowBack }), [allowBack, preventBack]);

    // prepare RouteLeaveContext value
    const prevent = useCallback((id) => {
      dispatchAction(["preventLeave", { id }]);
    }, []);
    const allow = useCallback((id) => {
      dispatchAction(["allowLeave", { id }]);
    }, []);
    const confirm = useCallback((id) => {
      dispatchAction(["confirmLeave", { id }]);
    }, []);
    const refuse = useCallback((id) => {
      dispatchAction(["refuseLeave", { id }]);
    }, []);
    let nextRouteUu5Route = pendingSetRoute ? pendingSetRoute.uu5Route : pendingHistoryRoute?.uu5Route;
    let nextRouteParams = pendingSetRoute ? pendingSetRoute.params : pendingHistoryRoute?.params;
    let nextRouteFragment = pendingSetRoute ? pendingSetRoute.fragment : pendingHistoryRoute?.fragment;
    let nextRoute = useMemo(
      () => ({ uu5Route: nextRouteUu5Route, params: nextRouteParams, fragment: nextRouteFragment }),
      [nextRouteFragment, nextRouteParams, nextRouteUu5Route],
    );
    const routeLeaveCtxValue = useMemo(() => {
      return { id: preventLeaveActiveId, nextRoute, prevent, allow, confirm, refuse };
    }, [preventLeaveActiveId, nextRoute, prevent, allow, confirm, refuse]);
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      <RouteContext.Provider value={routeCtxValue}>
        <RouteLeaveContext.Provider value={routeLeaveCtxValue}>
          <RouteBackContext.Provider value={routeBackCtxValue}>
            {typeof children === "function" ? children({ ...routeCtxValue, ...routeLeaveCtxValue }) : children}
          </RouteBackContext.Provider>
        </RouteLeaveContext.Provider>
      </RouteContext.Provider>
    );
    //@@viewOff:render
  },
});

//@@viewOn:helpers
function routeReducer(state, [action, payload]) {
  // state:
  //   {
  //     route: { uu5Route, params, fragment, skipHistory, component, prevRoute: { uu5Route, params, fragment }, index, isPreventBackLastEntry },
  //     pendingSetRoute: { uu5Route, params, fragment, options, scrollTop }, // route pending due to setRoute; contains args that the setRoute was called with
  //     pendingHistoryRoute: historyItemState, // see below
  //     pendingOpResult: null / "leave", // gets null-ed during setRoute() and gets filled with "leave" after all preventLeaveList confirmed leaving (or gets null-ed again if something refused)
  //     pendingOpOriginalScrollTop: null, // when using Forward/Back, this contains scrollTop at that moment before switching to target route (which will be/won't be stored to original route's history entry depending on leave-confirmation)
  //     preventLeaveList: [],
  //     preventLeaveActiveId: null,
  //     preventLeaveWaitingForPopState: false, // when using Forward/Back, we will get popstate event which is already at target history entry and we go back to original (from which we left) to update its state; and this flag shows whether we already got there
  //     preventBackInfo: null / { callback }, // when route component calls preventBack(callback), we will start blocking popstate event and calling callback() instead so that the component can change its state (i.e. component will react to Back button instead of our router)
  //     pendingScrollTopInfo: null / { scrollTop, fragment } // where to scroll if applying route from Forward/Back
  //   }
  // historyItemState (item state saved in history API):
  //   { uu5Route, params, fragment, skipHistory, prevRoute: { uu5Route, params, fragment }, index, isPreventBackLastEntry, scrollTop }
  //   - component is not there because it's not serializable
  let newState = state;
  switch (action) {
    case "init": {
      let { scrollTop, ...route } = payload;
      newState = {
        route,
        pendingSetRoute: null,
        pendingHistoryRoute: null,
        pendingOpResult: null,
        pendingOpOriginalScrollTop: null,
        preventLeaveList: [],
        preventLeaveActiveId: null,
        preventLeaveWaitingForPopState: false,
        preventBackInfo: null,
        pendingScrollTopInfo: scrollTop != null || route.fragment ? { scrollTop, fragment: route.fragment } : null,
      };
      break;
    }
    case "setRoute": {
      // if setRoute was called with state-updater function then pass { uu5Route, params, options } there
      if (typeof payload?.updater === "function") {
        let { updater, ...otherPayload } = payload;
        let { uu5Route, params, fragment, options } = updater(
          state.pendingSetRoute
            ? {
                uu5Route: state.pendingSetRoute.uu5Route,
                params: state.pendingSetRoute.params,
                fragment: state.pendingSetRoute.fragment,
                options: state.pendingSetRoute.options,
              }
            : {
                uu5Route: state.route.uu5Route,
                params: state.route.params,
                fragment: state.route.fragment,
                options: {},
              },
        );
        payload = { uu5Route, params, fragment, options, ...otherPayload };
      }
      // convert new route's params to string values (to be consistent with how they would be
      // retrieved from URL during page load of such route)
      if (payload.params) payload.params = paramsToStringValues(payload.params);

      newState = { ...state };
      newState.pendingSetRoute = { ...payload };
      newState.pendingHistoryRoute = null;
      newState.pendingHistoryRouteNeedsRollback = false;
      let needsPreventLeaveCheck = !payload?.options?.replace && state.preventLeaveList.length > 0;
      newState.preventLeaveActiveId = needsPreventLeaveCheck
        ? state.preventLeaveList[state.preventLeaveList.length - 1]
        : null;
      newState.preventLeaveWaitingForPopState = false;
      newState.pendingOpResult = needsPreventLeaveCheck ? null : "leave";
      newState.pendingOpOriginalScrollTop = null;
      newState.pendingScrollTopInfo = null;
      break;
    }
    case "browserHistoryNavigation": {
      // native navigation via Back/Forward browser buttons (from & to the same app)
      let { route, resultSignal, scrollTop, forceRollback } = payload;
      newState = { ...state };
      newState.pendingSetRoute = null;
      newState.pendingHistoryRoute = route;
      newState.preventLeaveActiveId = state.preventLeaveList[state.preventLeaveList.length - 1];
      let needsRollback = forceRollback || newState.preventLeaveActiveId != null;
      newState.pendingHistoryRouteNeedsRollback = resultSignal.needsRollback = needsRollback;
      newState.preventLeaveWaitingForPopState = needsRollback;
      newState.pendingOpResult = resultSignal.needsRollback ? null : "leave";
      newState.pendingOpOriginalScrollTop = scrollTop;
      newState.pendingScrollTopInfo = null;
      break;
    }
    case "browserHistoryNavigationBackAtOriginalEntry": {
      // user was going Back/Forward, we decided we needed to go back to originating entry
      // (e.g. because we want to display leave-confirmation or because we want to remember scrollTop
      // of the route we left from) and now we're there => allow applying the route, or wait more for leave-confirmation
      if (!state.pendingHistoryRoute || !state.preventLeaveWaitingForPopState) break; // ignore
      newState = { ...state };
      newState.preventLeaveWaitingForPopState = false;
      newState.pendingOpResult = newState.preventLeaveActiveId != null ? null : "leave";
      break;
    }
    case "applyRoute": {
      let {
        route: { scrollTop, ...route },
        preserveBackInfo,
      } = payload;
      newState = {
        ...state,
        route,
        pendingSetRoute: null,
        pendingHistoryRoute: null,
        preventLeaveActiveId: null,
        preventLeaveWaitingForPopState: false,
        pendingOpResult: null,
        pendingOpOriginalScrollTop: null,
        pendingHistoryRouteNeedsRollback: false,
        preventBackInfo: preserveBackInfo ? state.preventBackInfo : null,
        pendingScrollTopInfo: scrollTop != null || route.fragment ? { scrollTop, fragment: route.fragment } : null,
      };
      break;
    }

    case "preventLeave": {
      let { id } = payload;
      if (state.preventLeaveList.indexOf(id) === -1) {
        newState = { ...state, preventLeaveList: [...state.preventLeaveList, id] };
      }
      break;
    }
    case "confirmLeave":
    case "allowLeave": {
      let { id } = payload;
      let index = state.preventLeaveList.indexOf(id);
      if (index !== -1) {
        let filtered = state.preventLeaveList.slice(0, index).concat(state.preventLeaveList.slice(index + 1));
        newState = { ...state, preventLeaveList: filtered };
        if (state.preventLeaveActiveId === id) {
          newState.preventLeaveActiveId = filtered[index - 1] ?? null;
          if (newState.preventLeaveActiveId == null) {
            newState.pendingOpResult = newState.preventLeaveWaitingForPopState ? null : "leave";
          }
        }
      }
      break;
    }
    case "refuseLeave": {
      let { id } = payload;
      if (!id || id !== state.preventLeaveActiveId) break; // ignore
      newState = {
        ...state,
        pendingSetRoute: null,
        pendingHistoryRoute: null,
        preventLeaveActiveId: null,
        preventLeaveWaitingForPopState: false,
        pendingOpResult: null,
        pendingOpOriginalScrollTop: null,
        pendingHistoryRouteNeedsRollback: false,
        pendingScrollTopInfo: null,
      };
      break;
    }

    case "preventBack": {
      let { callback } = payload;
      newState = {
        ...state,
        route: state.route.isPreventBackLastEntry
          ? state.route
          : {
              ...state.route,
              index: (state.route.index || 0) + 1,
              skipHistory: true,
              isPreventBackLastEntry: true,
            },
        preventBackInfo: { callback },
      };
      break;
    }
    case "allowBack": {
      newState = {
        ...state,
        preventBackInfo: null,
      };
      break;
    }
    case "allowBackCompleted": {
      let { route } = payload;
      if (state.route?.isPreventBackLastEntry && !state.preventBackInfo) {
        newState = {
          ...state,
          route,
        };
      }
      break;
    }
  }
  // console.log({ action, fromState: state, toState: newState });
  return newState;
}

function historySetState(replace, ...args) {
  try {
    history[replace ? "replaceState" : "pushState"](...args);
  } catch (e) {
    // cannot do replace/pushState when in <iframe srcdoc="&lt;html..." (ends with DOMException
    // so ignore it), e.g. in uuBookKit examples
    if (!(window.frameElement && e instanceof DOMException)) throw e;
  }
}

function routeToUrl(route) {
  if (!route) return undefined;
  let { uu5Route, params, fragment } = route;
  let url = new URL(uu5Route?.replace(/^\/+/, ""), appBaseUri);
  if (params) {
    for (let k in params) {
      if (params[k] != null) url.searchParams.set(k, params[k]);
    }
  }
  if (fragment) url.hash = fragment;
  return url.toString();
}

function paramsToStringValues(params) {
  if (typeof params !== "object" || !params) return undefined;
  let result = {};
  for (let k in params) {
    if (params[k] != null) result[k] = params[k] + "";
  }
  return Object.keys(result).length === 0 ? undefined : result;
}

function repeatUntil(fn, maxTime, nextAttemptDelay) {
  let result = fn();
  if (result) return;

  let timeout;
  let startTime = Date.now();
  let attempt = () => {
    let result = fn();
    if (!result && Date.now() - startTime < maxTime) {
      timeout = setTimeout(attempt, nextAttemptDelay);
    }
  };
  timeout = setTimeout(attempt, nextAttemptDelay);
  return () => clearTimeout(timeout);
}
//@@viewOff:helpers

export { RouteProvider };
export default RouteProvider;
