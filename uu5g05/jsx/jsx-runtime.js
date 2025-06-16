// used from libraries depending on uu5g05 (this gets bundled into them); used due to uu5devkitg01-plugin's .babelrc config regarding @babel/preset-react preset
const Uu5 = require("uu5g05");
const runtime = Uu5._jsxJsxRuntime;
if (runtime) {
  Object.assign(exports, runtime);
} else {
  // temporary flow - used in case that a library was built with support for React 19's jsx-runtime (uu5devkitg01 >= 1.4.0 and uu5g05 >= 1.39.0)
  // so it contains this piece of code bundled with it and JSX performs calls jsx(...) or jsxs(...), but then the library was used in an on-premise
  // environment with older runtime version of uu5g05 (which doesn't have jsx/jsxs yet, i.e. it doesn't have _jsxJsxRuntime runtime export)
  //   => fall back to using Uu5.Utils.Element.create
  // NOTE This might be needed for longer term, e.g. because legacy SESM uses bootstraping via old CDN g01 which contains uu5g05 < 1.39.0 but then
  // it loads new libs via uuAppLibraryRegistry (that were built against uu5g05 >= 1.39.0 with new JSX transpilation).
  let createElement = Uu5.Utils.Element.create;
  exports.Fragment = Uu5.Fragment;
  exports.jsx = function (type, config, maybeKey) {
    let key = config.key !== undefined ? config.key : maybeKey;
    return createElement(type, key !== config.key ? { ...config, key } : config);
  };
  exports.jsxs = function (type, config, maybeKey) {
    let { children, ...otherProps } = config;
    let key = config.key !== undefined ? config.key : maybeKey;
    return createElement(type, key !== config.key ? { ...otherProps, key: maybeKey } : otherProps, ...children);
  };
}
