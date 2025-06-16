import "./_internal/polyfills/polyfills.js";

import * as Exports from "./exports.js";
import LibraryRegistry from "./utils/library-registry.js";
import "./_internal/startup.js";

export * from "./exports.js";
export default Exports;

if (process.env.NODE_ENV !== "test") {
  console.log(
    `${process.env.NAME}-${process.env.VERSION} © Unicorn\nTerms of Use: https://unicorn.com/tou/${process.env.NAME}`,
  );
}
LibraryRegistry.registerLibrary({
  name: process.env.NAME,
  version: process.env.VERSION,
  namespace: process.env.NAMESPACE,
});

// we'll still export uu5g05 into global variable so that JSX pragmas can be used
// (Uu5g05.Utils.Element.create + Uu5g05.Fragment), however, we'll prevent from adding
// anything to the value
// eslint-disable-next-line no-import-assign
const frozenExports = Object.freeze(Exports);
const publish = (scope, exports) => {
  scope.Uu5 = exports;
  scope.Uu5g05 = {
    Utils: {
      Element: {
        create: exports.Utils.Element.create,
      },
    },
  };
  Object.defineProperty(scope.Uu5g05, "Fragment", Object.getOwnPropertyDescriptor(exports, "Fragment"));
};
if (typeof window !== "undefined") publish(window, frozenExports);
if (process.env.NODE_ENV === "test" && typeof global !== "undefined") publish(global, frozenExports); // Jest tests
