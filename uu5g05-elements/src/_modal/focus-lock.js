//@@viewOn:imports
import ReactFocusLock from "react-focus-lock";
import { Utils, createComponentWithRef, createComponent, Fragment } from "uu5g05";
import Config from "../config/config.js";
//@@viewOff:imports

//@@viewOn:constants
//@@viewOff:constants

//@@viewOn:helpers
function _whiteList(element) {
  // if focus got onto textarea used by Utils.Clipboard.write() then allow it (return false)
  // NOTE Copying to clipboard via element appended to document.body is often used by other codebases
  // so let's allow moving focus to any such direct child of document.body.
  return element?.parentNode === document.body ||
    (element === document.body && window.frameElement) || // we might be showing Modal inside of iframe and trying to put cursor outside iframe
    element?.tagName === "TEXTAREA" // allow focusing arbitrary TEXTAREA-s because they're commonly used by 3rd-party libraries for Ctrl+C, e.g. pqgrid (and these are nested e.g. in body>div>textarea)
    ? false
    : true;
}
//@@viewOff:helpers

const FocusLock = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "FocusLock",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render({ children, ...focusLockProps }) {
    //@@viewOn:private
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      <ReactFocusLock {...focusLockProps} as={FocusLockWithRef} whiteList={_whiteList}>
        {
          // NOTE ReactFocusLock surrounds this marker with extra <div>-s, i.e. we'll replace this Marker with children(...) result
          // in FocusLockWithRef component.
        }
        <Marker>{children}</Marker>
      </ReactFocusLock>
    );
    //@@viewOff:render
  },
});

const FocusLockWithRef = createComponentWithRef({
  uu5Tag: Config.TAG + "FocusLockWithRef",
  render(props, ref) {
    const { children, ...focusLockElementProps } = props;
    const content = Utils.Content.toArray(children).map((it) =>
      it?.type === Marker ? it.props.children({ ref, ...focusLockElementProps }) : it,
    );
    return Utils.Element.create(Fragment, undefined, ...content);
  },
});

function Marker(props) {
  return null;
}

export default FocusLock;
