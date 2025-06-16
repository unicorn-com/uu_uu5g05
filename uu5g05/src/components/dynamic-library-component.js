//@@viewOn:imports
import createComponent from "../create-component/create-component.js";
import PropTypes from "../prop-types.js";
import Config from "../config/config.js";
import { ERROR_LIBRARY_LOAD_FAILED } from "../_internal/library-loader.js";
import { ERROR_LIBRARY_JSON_LOAD_FAILURE } from "../utils/library-registry.js";
import Lsi from "../config/lsi.js";
import LsiBasic from "../_internal/lsi-basic.js";
import ErrorComponent from "../_internal/error.js";
import useDynamicLibraryComponent from "../hooks/use-dynamic-library-component.js";
//@@viewOff:imports

const DynamicLibraryComponent = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "DynamicLibraryComponent",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    uu5Tag: PropTypes.string.isRequired,
    props: PropTypes.object,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    uu5Tag: undefined,
    props: undefined,
  },
  //@@viewOff:defaultProps

  render(fullProps) {
    let { uu5Tag, props, ...restProps } = fullProps;
    let { Component, errorData, state } = useDynamicLibraryComponent(uu5Tag);

    //@@viewOn:render
    let mergedProps = { ...restProps, ...props }; // some props are passed directly (e.g. nestingLevel, some can be in prop "props")
    return state === "errorNoData" ? (
      <ErrorComponent nestingLevel={mergedProps.nestingLevel}>
        <LsiBasic
          lsi={
            Lsi.dynamicLibraryComponent[
              (errorData.error.code === ERROR_LIBRARY_JSON_LOAD_FAILURE ||
                errorData.error.code === ERROR_LIBRARY_LOAD_FAILED) &&
              errorData.error.wasOffline
                ? "offline"
                : "notFound"
            ]
          }
          params={[uu5Tag]}
        />
      </ErrorComponent>
    ) : Component ? (
      <Component {...mergedProps} />
    ) : (
      <span className="uu5-pending uu5-bricks-loader" role="alert" aria-busy="true" />
    ); // uu5-bricks-loader only for backward compatibility with uuPdfConverter
    //@@viewOff:render
  },
});

export { DynamicLibraryComponent };
export default DynamicLibraryComponent;
