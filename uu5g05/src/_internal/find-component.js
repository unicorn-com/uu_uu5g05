import checkTag from "../_internal/check-tag.js";
import Lsi from "../config/lsi.js";
import ErrorComponent from "../_internal/error.js";
import DynamicLibraryComponent from "../components/dynamic-library-component.js";
import LsiBasic from "./lsi-basic.js";
import { createComponent } from "../create-component/create-component";
import { splitNamespaceWithMaybeVersionTagToParts } from "../utils/library-registry.js";

const CACHE_MAP = {};

function findComponent(componentNameOrTagMaybeWithVersion, propsToPass, children) {
  let Component = checkTag(componentNameOrTagMaybeWithVersion, true);
  let { key, ...props } = propsToPass;
  if ((!Component && typeof componentNameOrTagMaybeWithVersion !== "string") || Component === "invalidTag") {
    Component = ErrorComponent;
    props = { ref: props.ref };
    children = <LsiBasic lsi={Lsi.dynamicLibraryComponent.invalidTag} params={[componentNameOrTagMaybeWithVersion]} />;
  }

  let result;
  if (Component)
    result = (
      <Component key={key} {...props}>
        {children}
      </Component>
    );
  else {
    let Comp = (CACHE_MAP[componentNameOrTagMaybeWithVersion] ??= createComponent({
      uu5Tag: splitNamespaceWithMaybeVersionTagToParts(componentNameOrTagMaybeWithVersion)[0],
      tagName: splitNamespaceWithMaybeVersionTagToParts(componentNameOrTagMaybeWithVersion)[0], // because of uu5g04
      isDynamicLibraryComponent: true,
      render({ children, ...compProps }) {
        return (
          <DynamicLibraryComponent uu5Tag={componentNameOrTagMaybeWithVersion} props={compProps}>
            {children}
          </DynamicLibraryComponent>
        );
      },
    }));

    result = (
      <Comp key={key} {...props}>
        {children}
      </Comp>
    );
  }

  return result;
}

export { findComponent };
export default findComponent;
