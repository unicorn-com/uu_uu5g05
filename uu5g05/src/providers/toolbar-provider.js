//@@viewOn:imports
import { useMemo, useState } from "../hooks/react-hooks.js";
import createComponent from "../create-component/create-component.js";
import Config from "../config/config.js";
import Dom from "../utils/dom.js";
import Context from "../utils/context.js";
import ToolbarContext from "../contexts/toolbar-context.js";
import useActivePublisher from "../_internal/use-active-publisher.js";
import RenderLeftToolbarContext from "../_internal/render-left-toolbar-context.js";
//@@viewOff:imports

//@@viewOn:constants
//@@viewOff:constants

//@@viewOn:css
const Css = {
  content: () =>
    Config.Css.css({
      display: "none",
      "&:last-child": { display: "contents" },
    }),
};
//@@viewOff:css

//@@viewOn:helpers
const [_ToolbarProviderContext, useToolbarProviderContext] = Context.create();

function RendererWrapper(props) {
  // NOTE This component knows `children` (those that were last passed into renderLeft()/Right() calls)
  // and properly handles cases such as remount of Toolbar component (which would provide different
  // left/right portal elements than before).
  const { position, children } = props;
  const { element, renderContent } = useToolbarProviderContext()[position] || {};
  const elementAttrs = useActivePublisher();

  const content = (
    <div className={Css.content()} {...elementAttrs}>
      {children}
    </div>
  );
  return element
    ? Dom.createPortal(typeof renderContent === "function" ? renderContent({ children: content }) : content, element)
    : null;
}
//@@viewOff:helpers

const ToolbarProvider = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "ToolbarProvider",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render({ children }) {
    //@@viewOn:private
    const [leftSettings, setLeftSettings] = useState();
    const [rightSettings, setRightSettings] = useState();

    const renderLeftToolbarContextValue = useMemo(() => ({ value: true }), []);

    const staticContextValues = useMemo(() => {
      const setLeftElement = (element, renderContent = undefined) => setLeftSettings({ element, renderContent });
      const setRightElement = (element, renderContent = undefined) => setRightSettings({ element, renderContent });
      return {
        setLeftElement,
        setRightElement,

        renderLeft: (children) => (
          <RenderLeftToolbarContext.Provider value={renderLeftToolbarContextValue}>
            <RendererWrapper position="left">{children}</RendererWrapper>
          </RenderLeftToolbarContext.Provider>
        ),
        renderRight: (children) => <RendererWrapper position="right">{children}</RendererWrapper>,
      };
    }, []);
    const toolbarless = !leftSettings && !rightSettings;

    const contextValue = useMemo(() => {
      return {
        ...staticContextValues,
        toolbarless,
      };
    }, [staticContextValues, toolbarless]);

    const providerContextValue = useMemo(() => {
      return {
        left: leftSettings,
        right: rightSettings,
      };
    }, [leftSettings, rightSettings]);
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      <_ToolbarProviderContext.Provider value={providerContextValue}>
        <ToolbarContext.Provider value={contextValue}>
          {typeof children === "function" ? children(contextValue) : children}
        </ToolbarContext.Provider>
      </_ToolbarProviderContext.Provider>
    );
    //@@viewOff:render
  },
});

export { ToolbarProvider };
export default ToolbarProvider;
