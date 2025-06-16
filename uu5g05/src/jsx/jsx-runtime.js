// NOTE Differences from React's jsx-runtime:
// 1. We have a lot of libraries (EOL / EOM) with function components with static defaultProps. React no longer handles these
//    when using react/jsx-runtime. For now, we'll forward these to React.createElement to keep them working.
// 2. React apps (non-uu5) are typically bundled into single bundle with no external dependencies (excluding chunks known at build time)
//    and single version of React.
//    We don't have that - we have libraries that are built at different times and that can have different runtime version of React
//    than they were built with (more precisely, our libs depend on uu5g05 and assume that uu5g05 will handle most incompatibilities
//    that might emerge due to running with different uu5g05/React version than what was available at build time).
//    Additionally, React's jsx-runtime (non-production mode) e.g. for React 19 will fail to work if in browser it gets to be run with
//    React 18.
// 3. Ocassionally, dev users override few libs on production so that they use non-minified uu5g05 and minified everything else, which
//    then mustn't use development react/jsx-runtime checks as some internal fields used in checks are not available in minified React.
//
// To solve all of these points, we'll compile our own jsx-runtime that will be available as standard uu5g05's export (runtime)
// and libraries will be built so that they use this export. I.e. our jsx-runtime is built at the time when uu5g05 is built, and
// to prevent any non-production mode issues, development checks will be allowed only if built-time version of React agrees with
// runtime version of React.

const { Fragment } = require("../fragment.js");
const { createElement } = require("./index.js");
const { checkJsxBeforeCreate } = require("../utils/element.js");

const reactBuildTimeVersion = process.env.REACT_BUILD_VERSION;
const reactRuntimeVersion = require("react").version;
const isReactRuntimeMinified = require("react").Component.name !== "Component";
const isSameMajor =
  reactRuntimeVersion && reactBuildTimeVersion && parseInt(reactRuntimeVersion) === parseInt(reactBuildTimeVersion);

// there's a scenario in which we might get older React version (18.x) even if we were built with 19.x - if uu5g05 was deployed
// to legacy CDN under /1.0.0/ (1.x) but uuApp doesn't use uuAppLibraryRegistry so it uses build-time major versions (and was
// last built & deployed using uu5g05 that was using React 18 but already contained jsx-runtime)
// => in such case behave as React 18, i.e. handle default props during JSX creation (by forwarding it to createElement)
const shouldRenderMergeDefaultProps = parseInt(reactBuildTimeVersion) >= 19 && parseInt(reactRuntimeVersion) >= 19;

// necessary exports: see node_modules/@babel/plugin-transform-react-jsx/lib/create-plugin.js#138 (`define("id/jsx", ...)` calls)
if (process.env.NODE_ENV !== "production") {
  // development / tests
  const allowReactBuildTimeChecks = !isReactRuntimeMinified && isSameMajor;
  if (process.env.NODE_ENV !== "test" && !isReactRuntimeMinified && !isSameMajor) {
    console.warn(
      `Some React development checks regarding JSX usage are disabled because this version of uu5g05 (${process.env.VERSION}) was built for different major version of React (${reactBuildTimeVersion}) than the current runtime React version (${reactRuntimeVersion}). For best development support use matching versions of libraries.`,
    );
  }

  let reactJsxRuntime;
  const doReactChecksOnly = (fn) => {
    try {
      if (allowReactBuildTimeChecks) {
        reactJsxRuntime ??= require("react/jsx-runtime"); // lazy require so that we don't run this if we have e.g. React version mismatch
        fn();
      }
    } catch (e) {
      console.error(e);
    }
  };

  let reactJsxDevRuntime;
  exports.Fragment = Fragment;

  if (shouldRenderMergeDefaultProps) {
    // NOTE This is the main development flow for React >= 19.
    // skip processing of defaultProps, i.e. do not use our/React's createElement
    const reactJsxRuntime = require("react/jsx-runtime");
    const { createElementWithEmotionFix } = require("../utils/element.js");
    exports.jsx = function (type, config, maybeKey, ...args) {
      config = checkJsxBeforeCreate(type, config);
      return createElementWithEmotionFix(() => reactJsxRuntime.jsx(type, config, maybeKey, ...args));
    };
    // called if having at least 2 children (static)
    exports.jsxs = function (type, config, maybeKey, ...args) {
      config = checkJsxBeforeCreate(type, config);
      return createElementWithEmotionFix(() => reactJsxRuntime.jsxs(type, config, maybeKey, ...args));
    };
    // NOTE @babel/preset-react has `development` option which we currently don't use (it's false). If it was true,
    // babel would use @babel/plugin-transform-react-jsx-development and therefore look for exports.jsxDEV, so we'll add
    // that one as well just to be safe.
    let reactJsxDevRuntime;
    exports.jsxDEV = function (type, config, maybeKey, ...args) {
      config = checkJsxBeforeCreate(type, config);
      reactJsxDevRuntime ??= require("react/jsx-dev-runtime");
      return createElementWithEmotionFix(() => reactJsxDevRuntime.jsxDEV(type, config, maybeKey, ...args));
    };
  } else {
    // do not skip processing of defaultProps, i.e. use createElement (with proper key)
    exports.jsx = function (type, config, maybeKey, source, self) {
      // let React show any development warnings (but ignore its result)
      // NOTE We're passing { ...config } because React modifies the instance.
      doReactChecksOnly(() => reactJsxRuntime.jsx(type, { ...config }, maybeKey, source, self));

      // prefer spread key / after-spread key (config.key) to before-spread key (maybeKey)
      // just like reactJsxRuntime <= 19 does
      let key = config.key !== undefined ? config.key : maybeKey;
      return createElement(type, key !== config.key ? { ...config, key: maybeKey } : config);
    };
    exports.jsxs = function (type, config, maybeKey, source, self) {
      doReactChecksOnly(() => reactJsxRuntime.jsxs(type, { ...config }, maybeKey, source, self));
      let { children, ...otherProps } = config;
      let key = config.key !== undefined ? config.key : maybeKey;
      return createElement(type, key !== config.key ? { ...otherProps, key: maybeKey } : otherProps, ...children);
    };
    exports.jsxDEV = function (type, config, maybeKey, isStaticChildren, source, self) {
      doReactChecksOnly(() => {
        reactJsxDevRuntime ??= require("react/jsx-dev-runtime");
        reactJsxDevRuntime.jsxDEV(type, { ...config }, maybeKey, isStaticChildren, source, self);
      });
      let key = config.key !== undefined ? config.key : maybeKey;
      if (isStaticChildren) {
        let { children, ...otherProps } = config;
        return createElement(
          type,
          key !== config.key ? { ...otherProps, key: maybeKey } : otherProps,
          ...(Array.isArray(children) ? children : children !== undefined ? [children] : []),
        );
      }
      return createElement(type, key !== config.key ? { ...config, key: maybeKey } : config);
    };
  }
} else {
  // production
  exports.Fragment = Fragment;

  if (shouldRenderMergeDefaultProps) {
    // NOTE This is the main production flow for React >= 19.
    // skip processing of defaultProps, i.e. do not use our/React's createElement
    let { jsx, jsxs } = require("react/jsx-runtime");
    exports.jsx = function (type, config, maybeKey) {
      config = checkJsxBeforeCreate(type, config);
      return jsx(type, config, maybeKey);
    };
    exports.jsxs = function (type, config, maybeKey) {
      config = checkJsxBeforeCreate(type, config);
      return jsxs(type, config, maybeKey);
    };
  } else {
    // do not skip processing of defaultProps, i.e. use createElement (with proper key)
    exports.jsx = function (type, config, maybeKey) {
      let key = config.key !== undefined ? config.key : maybeKey;
      return createElement(type, key !== config.key ? { ...config, key } : config); // includes checkJsxBeforeCreate
    };
    exports.jsxs = function (type, config, maybeKey) {
      let { children, ...otherProps } = config;
      let key = config.key !== undefined ? config.key : maybeKey;
      return createElement(type, key !== config.key ? { ...otherProps, key: maybeKey } : otherProps, ...children); // includes checkJsxBeforeCreate
    };
  }
}

// our custom export
exports.shouldRenderMergeDefaultProps = shouldRenderMergeDefaultProps;
