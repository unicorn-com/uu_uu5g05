//@@viewOn:imports
import { createVisualComponent, useDevice } from "uu5g05";
import Config from "./config/config.js";
import DialogView from "./_dialog/dialog-view.js";
import useLazyFocusLockComponent from "./_modal/use-lazy-focus-lock-component.js";
import useModalRegistration from "./_modal/use-modal-registration.js";
//@@viewOff:imports

const Dialog = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Dialog",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...DialogView.propTypes,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    ...DialogView.defaultProps,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { open } = props;
    const { isMobileOrTablet } = useDevice();

    const focusLockComponent = useLazyFocusLockComponent(props.open);
    useModalRegistration(open);
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      <DialogView
        {...props}
        isMobileOrTablet={isMobileOrTablet}
        focusLockComponent={focusLockComponent}
        _bottomSheetDisabled={!isMobileOrTablet}
      />
    );
    //@@viewOff:render
  },
});

//@@viewOn:helpers
//@@viewOff:helpers

export { Dialog };
export default Dialog;
