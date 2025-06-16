//@@viewOn:imports
import { createVisualComponent, Utils, PropTypes, useDevice } from "uu5g05";
import Config from "../config/config.js";
import withBottomSheet from "../_internal/with-bottom-sheet.js";
import useModalPosition from "./use-modal-position.js";
import UuGds from "../_internal/gds.js";
//@@viewOff:imports

const MARGIN = UuGds.getValue(["SpacingPalette", "adaptive", "largeScreen", "normal", "d"]);

const Css = {
  main: ({ fullscreen }, isMobileOrTablet) => {
    let staticClassName = Config.Css.css({
      position: "fixed",
      margin: 0,
    });

    let dynamicStyles = {};

    if (fullscreen || isMobileOrTablet) {
      dynamicStyles = {
        ...dynamicStyles,
        ...{
          top: 0,
          left: 0,
          right: 0,
          width: "100%",
          height: "100%",
        },
      };
    } else {
      dynamicStyles = {
        ...dynamicStyles,
        ...{
          top: 0,
          right: 0,
          width: "100%",
          height: "100%",
          ...Utils.Style.getMinMediaQueries("m", {
            top: MARGIN,
            right: MARGIN,
            width: `calc(100% - ${2 * MARGIN}px)`,
            height: `calc(100% - ${2 * MARGIN}px)`,
          }),
        },
      };
    }

    if (isMobileOrTablet) {
      dynamicStyles = {
        ...dynamicStyles,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "center",
        "::before": {
          content: "''",
          flex: "1",
          width: "100%",
        },
      };
    }

    return Utils.Css.joinClassName(staticClassName, Config.Css.css(dynamicStyles));
  },
};

let ModalView = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "ModalView",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    onMoveStart: PropTypes.func,
    collapsed: PropTypes.bool,
    fullscreen: PropTypes.bool,
    metrics: PropTypes.object,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    onMoveStart: undefined,
    collapsed: undefined,
    fullscreen: undefined,
    metrics: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { collapsed, children, metrics } = props;

    const { isMobileOrTablet } = useDevice();

    const skipModalPosition = !!props.onMoveStart;
    let { style: modalViewStyle, onMoveStart } = useModalPosition(collapsed, metrics);
    if (skipModalPosition) {
      modalViewStyle = undefined;
      onMoveStart = props.onMoveStart;
    }

    if (isMobileOrTablet) onMoveStart = undefined;
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const attrs = Utils.VisualComponent.getAttrs(props, Css.main(props, isMobileOrTablet));
    return (
      <div {...attrs} style={{ ...props.style, ...modalViewStyle }}>
        {typeof children === "function" ? children({ onMoveStart }) : children}
      </div>
    );
    //@@viewOff:render
  },
});

ModalView = withBottomSheet(ModalView);

export { ModalView };
export default ModalView;
