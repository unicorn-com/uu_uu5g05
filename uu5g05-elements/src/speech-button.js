//@@viewOn:imports
import { createVisualComponent, useSpeechToText, Utils, PropTypes, useBackground, useLsi } from "uu5g05";
import Config from "./config/config.js";
import Button from "./button";
import MenuItem from "./menu-item";
import UuGds from "./_internal/gds";
import importLsi from "./lsi/import-lsi";
//@@viewOff:imports

//@@viewOn:constants
//@@viewOff:constants

//@@viewOn:css
const Css = {
  main: ({ colorScheme, significance, background, speaking }) => {
    const defaultStyles = UuGds.Shape.getValue(["interactiveElement", background, colorScheme, significance]);
    const marked = { ...UuGds.Shape.getStateStyles(defaultStyles.default) };

    const highlightedStyles = UuGds.Shape.getValue([
      "interactiveElement",
      background,
      colorScheme === "red" ? "building" : "red",
      "highlighted",
    ]);
    const markedHighlighted = { ...UuGds.Shape.getStateStyles(highlightedStyles.default) };

    const classNames = [
      Config.Css.css({
        animationName: Config.Css.keyframes({
          "0%": marked,
          "50%": markedHighlighted,
          "100%": marked,
        }),
        animationDuration: "2s",
        animationTimingFunction: "linear",
        animationIterationCount: "infinite",
      }),
    ];

    if (speaking) {
      classNames.push(
        Config.Css.css({
          "& > .uugdsstencil-shape-circle-solid": {
            color: UuGds.ColorPalette.getValue(["basic", "red", "mainDarkest"]),
          },
        }),
      );
    }

    return classNames.join(" ");
  },
};
//@@viewOff:css

//@@viewOn:helpers
function getChildren(children, params) {
  return typeof children === "function" ? children(params) : children;
}

//@@viewOff:helpers

const SpeechButton = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "SpeechButton",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...Button.propTypes,
    onStart: PropTypes.func,
    onSpeechStart: PropTypes.func,
    onSpeech: PropTypes.func,
    onSpeechEnd: PropTypes.func,
    onEnd: PropTypes.func,
    language: PropTypes.string,
    displayType: PropTypes.oneOf(["button", "button-compact", "menu-item"]),
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    colorScheme: Button.defaultProps.colorScheme,
    significance: Button.defaultProps.significance,
    displayType: "button",
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    let {
      onStart,
      onSpeechStart,
      onSpeech,
      onSpeechEnd,
      onEnd,
      children,
      displayType,
      onClick,
      tooltip,
      icon,
      language,
      ...restProps
    } = props;

    const { recording, speaking, startRecording, stopRecording, error } = useSpeechToText({
      language,
      onStart,
      onSpeechStart,
      onSpeech,
      onSpeechEnd,
      onEnd,
    });

    const label = useLsi({ import: importLsi, path: ["SpeechButton", "label"] });
    const errorTooltip = useLsi(error ? { import: importLsi, path: ["SpeechButton", "error", error.code] } : undefined);
    if (errorTooltip) tooltip = errorTooltip;
    //@@viewOff:private

    //@@viewOn:render
    let Comp = Button;
    let propsToPass;
    switch (displayType) {
      case "menu-item":
        Comp = MenuItem;
        propsToPass = {
          ...restProps,
          children: getChildren(children, { recording, speaking, displayType }) ?? label,
          tooltip,
        };
        break;
      case "button-compact":
        propsToPass = { ...restProps, tooltip: tooltip ?? label };
        break;
      default:
        propsToPass = {
          ...restProps,
          children: getChildren(children, { recording, speaking, displayType }),
          tooltip: tooltip ?? (children ? undefined : label),
        };
        break;
    }

    const background = useBackground();

    return useSpeechToText.SpeechRecognition ? (
      <Comp
        {...propsToPass}
        icon={icon === undefined ? (speaking ? "uugdsstencil-shape-circle-solid" : "uugdsstencil-media-mic") : icon}
        disabled={!!errorTooltip}
        {...(recording
          ? {
              pressed: true,
              onClick: (e) => {
                onClick?.(e);
                stopRecording();
              },
              className: Utils.Css.joinClassName(propsToPass.className, Css.main({ ...props, background, speaking })),
            }
          : {
              onClick: (e) => {
                onClick?.(e);
                startRecording();
              },
            })}
      />
    ) : null;
    //@@viewOff:render
  },
});

SpeechButton.isEnabled = !!useSpeechToText.SpeechRecognition;

//@@viewOn:exports
export { SpeechButton };
export default SpeechButton;
//@@viewOff:exports
