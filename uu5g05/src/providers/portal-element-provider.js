//@@viewOn:imports
import { createComponent } from "../create-component/create-component.js";
import Config from "../config/config.js";
import PropTypes from "../prop-types.js";
import { useMemo, useState } from "../hooks/react-hooks.js";
import PortalElementContext, { usePortalElementContext } from "../contexts/portal-element-context.js";
import { useModalBusContext } from "../contexts/modal-bus-context";
import Uu5Loader from "../utils/uu5-loader";
//@@viewOff:imports

//@@viewOn:constants
//@@viewOff:constants

//@@viewOn:helpers
//@@viewOff:helpers

const PortalElementProvider = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "PortalElementProvider",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    element: PropTypes.object,
    filter: PropTypes.func,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    element: undefined,
    filter: undefined, // undefined <=> match all portal types
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { children, element, filter, skipModalBus } = props;
    const [portalElement, setPortalElement] = useState();

    const elementToPass = element ?? portalElement;

    const parentValue = usePortalElementContext();
    const contextValue = useMemo(
      () => ({
        element: elementToPass,
        filter,
        parentValue,
      }),
      [elementToPass, filter, parentValue],
    );

    const ctx = useModalBusContext();
    const hasTopLevelModalBus = !!ctx;
    //@@viewOff:private

    //@@viewOn:render
    let content = typeof children === "function" ? children(contextValue) : children;
    if (!skipModalBus && hasTopLevelModalBus) {
      const { ModalBus, AlertBus } = Uu5Loader.get("uu5g05-elements", import.meta.url) ?? {};
      if (ModalBus) {
        content = (
          <AlertBus>
            <ModalBus>{content}</ModalBus>
          </AlertBus>
        );
      }
    }

    return (
      <PortalElementContext.Provider value={contextValue}>
        {content}
        {element ? null : <div ref={setPortalElement} className={Config.Css.css({ display: "contents" })} />}
      </PortalElementContext.Provider>
    );
    //@@viewOff:render
  },
});

export { PortalElementProvider };
export default PortalElementProvider;
