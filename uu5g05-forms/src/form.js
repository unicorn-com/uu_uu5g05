//@@viewOn:imports
import { createVisualComponent } from "uu5g05";
import Config from "./config/config.js";
import FormProvider from "./form-provider.js";
import FormView from "./form-view.js";
import FormUnhandledError from "./form-unhandled-error.js";
//@@viewOff:imports

const Form = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Form",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...FormProvider.propTypes,
    ...FormView.propTypes,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    let { children, ...viewProps } = props;
    let formProviderProps = {};
    for (const prop in FormProvider.propTypes) {
      formProviderProps[prop] = props[prop];
      delete viewProps[prop];
    }
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      <FormProvider {...formProviderProps}>
        {typeof children === "function" ? (
          (...args) => <FormView {...viewProps}>{children(...args)}</FormView>
        ) : (
          <FormView {...viewProps}>{children}</FormView>
        )}
      </FormProvider>
    );
    //@@viewOff:render
  },
});

//@@viewOn:helpers
//@@viewOff:helpers

Form.View = FormView;
Form.Provider = FormProvider;
Form.UnhandledError = FormUnhandledError;

export { Form };
export default Form;
