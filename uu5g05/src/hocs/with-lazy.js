import { Suspense } from "react";
import UtilsComponent from "../utils/component.js";
import UtilsElement from "../utils/element.js";

/*
* Table = withLazy(async () => {
    await Utils.Uu5Loader.import("uu5g04-forms");
    return import("./table-lazy.js");
  }, <Uu5Elements.Pending />)
* */
function withLazy(importFn, fallback = "", statics) {
  const Component = UtilsComponent.lazy(importFn);

  const fn = UtilsComponent.forwardRef((props, ref) => (
    <Suspense
      fallback={
        typeof fallback === "function"
          ? fallback(props)
          : UtilsElement.isValid(fallback)
            ? UtilsElement.clone(fallback, props)
            : fallback
      }
    >
      <Component {...props} ref={ref} />
    </Suspense>
  ));

  if (statics) Object.assign(fn, statics);

  return fn;
}

export { withLazy };
export default withLazy;
