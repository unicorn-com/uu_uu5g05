//@@viewOn:imports
import { createComponent, PropTypes, Utils } from "uu5g05";
import UuGds from "../_internal/gds.js";
import Config from "../config/config.js";
import useIosKeyboardFix from "./use-ios-keyboard-fix.js";
//@@viewOff:imports

//@@viewOn:constants
const STATIC_TOP_GAP = 40;
//@@viewOff:constants

//@@viewOn:helpers
//@@viewOff:helpers

function withBottomSheet(Component, reserveSafeAreaInsetBottom) {
  const ResultComponent = createComponent({
    //@@viewOn:statics
    uu5Tag: `withBottomSheet(${Component.uu5Tag})`,
    //@@viewOff:statics

    //@@viewOn:propTypes
    propTypes: {
      borderRadius: PropTypes.borderRadius,
      _bottomSheetDisabled: PropTypes.bool,
    },
    //@@viewOff:propTypes

    //@@viewOn:defaultProps
    defaultProps: {
      _bottomSheetDisabled: false,
    },
    //@@viewOff:defaultProps

    render(props) {
      //@@viewOn:private
      const { className: propsClassName, children, _bottomSheetDisabled, ...otherProps } = props;
      const { borderRadius: propsBorderRadius = _bottomSheetDisabled ? undefined : "expressive" } = otherProps;
      let {
        bottomValue = 0,
        forbidReserveSafeArea,
        ref: bottomSheetRef,
      } = useIosKeyboardFix({ disabled: _bottomSheetDisabled });
      //@@viewOff:private

      //@@viewOn:interface
      //@@viewOff:interface

      //@@viewOn:render
      let extraClassName;
      if (!_bottomSheetDisabled) {
        let borderRadius = UuGds.getValue(["RadiusPalette", "box", propsBorderRadius]);
        if (propsBorderRadius && typeof propsBorderRadius === "object") borderRadius = borderRadius.max;
        let maxHeight =
          (forbidReserveSafeArea ? window.visualViewport.height : window.innerHeight) - STATIC_TOP_GAP + "px";
        if (reserveSafeAreaInsetBottom && !forbidReserveSafeArea) maxHeight += " - env(safe-area-inset-bottom)";

        let classNameObject = {
          paddingBottom: reserveSafeAreaInsetBottom ? "env(safe-area-inset-bottom)" : undefined,
          bottom: bottomValue,
          "&&": {
            width: "100vw", // necessary for popover
            maxWidth: "100vw",
            position: "fixed",
            top: "auto",
            borderTopLeftRadius: borderRadius,
            borderTopRightRadius: borderRadius,
            borderBottomRightRadius: 0,
            borderBottomLeftRadius: 0,
          },
        };
        classNameObject.maxHeight = `calc(${maxHeight})`;
        if (forbidReserveSafeArea && Math.round(window.innerHeight) - Math.round(window.visualViewport.height) !== 0) {
          // Only when it is iOS, Safari and keyboard is open - override PopoverBottomSheet's maxHeight
          classNameObject.maxHeight += " !important";
        }
        extraClassName = Config.Css.css(classNameObject);
      }

      return (
        <Component
          {...otherProps}
          borderRadius={propsBorderRadius}
          elementRef={Utils.Component.combineRefs(otherProps.elementRef, bottomSheetRef)}
          className={Utils.Css.joinClassName(propsClassName, extraClassName)}
        >
          {children}
        </Component>
      );
      //@@viewOff:render
    },
  });

  Utils.Component.mergeStatics(ResultComponent, Component);
  ResultComponent.uu5ComponentType = Component.uu5ComponentType;

  return ResultComponent;
}

export { withBottomSheet, STATIC_TOP_GAP };
export default withBottomSheet;
