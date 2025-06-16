//@@viewOn:imports
import { createVisualComponent, PropTypes, useDevice, useScreenSize, useState, Utils } from "uu5g05";
import Config from "../config/config";
import UuGds from "../_internal/gds";
import Icon from "../icon";
import Bar from "./bar";
import Text from "../text";
import RichIcon from "../rich-icon";
//@@viewOff:imports

const RELATIVE_HEIGHT = 0.25;
const IMAGE_SIZE = 100;

//@@viewOn:css
const Css = {
  main: ({ imageComponent, value }) =>
    Config.Css.css({
      display: "inline-flex",
      flexDirection: "column",
      alignItems: "center",

      marginInline: typeof value === "number" && imageComponent ? IMAGE_SIZE / 2 : undefined,
      marginBlockStart: typeof value === "number" && imageComponent ? IMAGE_SIZE : undefined,
      position: typeof value === "number" && imageComponent ? "relative" : undefined,
    }),
  box: ({ height }) =>
    Config.Css.css({
      display: "inline-flex",
      alignItems: "center",
      height,
      verticalAlign: height ? undefined : "middle",
    }),
  icon: ({ height, size }) => {
    return Config.Css.css({
      fontSize: height
        ? UuGds.SizingPalette.getValue(["relative", "l"], { height })
        : size === "max"
          ? "1.5em"
          : undefined,
      marginLeft: UuGds.SpacingPalette.getValue(["fixed", "a"]),
    });
  },
  opacity: ({ showOnHover, boxClassName }) =>
    Config.Css.css({
      opacity: showOnHover ? 0 : 1,
      [`.${boxClassName}:hover &`]: { opacity: showOnHover ? 1 : 0 },
      transition: "opacity 0.3s linear",
    }),
  text: ({ isMobile }) =>
    Config.Css.css({
      marginTop: UuGds.SpacingPalette.getValue(["fixed", isMobile ? "e" : "g"]),
      textAlign: "center",
    }),
  contentAfterHover: () => Config.Css.css({ position: "relative", display: "inline-flex", alignItems: "center" }),
};
//@@viewOff:css

const PendingHorizontal = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "PendingHorizontal",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    size: PropTypes.oneOf(["xxs", "xs", "s", "m", "l", "xl", "max"]),
    colorScheme: Bar.propTypes.colorScheme,
    progressColor: Bar.propTypes.progressColor,
    onCancel: PropTypes.func,
    cancelTooltip: PropTypes.lsi,
    imageSrc: PropTypes.string,
    icon: PropTypes.string,
    width: Bar.propTypes.width,
    progressWidth: Bar.propTypes.width,
    value: Bar.propTypes.progress,
    label: PropTypes.node,
    animated: Bar.propTypes.animated,
    imageComponent: PropTypes.oneOfType([PropTypes.elementType, PropTypes.element]),
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    let {
      size,
      colorScheme,
      progressColor,
      onCancel,
      cancelTooltip,
      imageSrc,
      imageComponent,
      icon,
      width,
      progressWidth,
      value,
      label,
      animated,
      children,
    } = props;

    const { isMobileOrTablet } = useDevice();
    const [screenSize] = useScreenSize();
    const isMobile = isMobileOrTablet && screenSize === "xs";

    const [id] = useState(() => Utils.String.generateId());
    const labelId = id + "-label";

    const attrs = Utils.VisualComponent.getAttrs(props);

    let mainAttrs, boxAttrs, image;
    let contentAfter, contentAfterHover;
    const barProps = { colorScheme, progressColor, progress: value, animated };
    if (!width) barProps.width = progressWidth;

    let height;
    if (size === "max") {
      const boxSize = UuGds.SizingPalette.getValue(["box", "1x1", isMobile ? "s" : "m"]).h;
      let style = { width: boxSize, height: boxSize };
      if (imageSrc || icon) {
        image = (
          <RichIcon
            imageSrc={imageSrc}
            icon={icon}
            colorScheme={colorScheme ?? "primary"}
            significance="subdued"
            style={style}
            className={Config.Css.css({ "& > span": { height: "100%", width: "100%" } })}
          />
        );
      } else if (imageComponent) {
        if (typeof value === "number") {
          // for Progress
          const animationTime = UuGds.getValue(["MotionPalette", "duration", "normal"]);

          style = {
            ...style,
            width: IMAGE_SIZE,
            height: IMAGE_SIZE,
            position: "absolute",
            insetBlockStart: -IMAGE_SIZE,
            insetInlineStart: (value / 100) * boxSize - IMAGE_SIZE / 2,
            transition: `inset-inline-start ${animationTime}s ease`,
          };
        } else {
          style = { ...style, display: "flex", justifyContent: "center", alignItems: "flex-end" };
        }
        image = <div className={Config.Css.css({ ...style })}>{imageComponent}</div>;
      }
      if (children) mainAttrs = attrs;
      barProps.height = UuGds.SizingPalette.getValue(["spot", "minor", isMobile ? "xxs" : "xs"]).h;
      barProps.width = boxSize;
      barProps.className = Config.Css.css({ marginTop: UuGds.SpacingPalette.getValue(["fixed", "b"]) });
    } else if (size) {
      height = UuGds.SizingPalette.getValue(["spot", "basic", size]).h;
      barProps.height = Math.round(RELATIVE_HEIGHT * height);
      if (width) barProps.className = Config.Css.css({ flex: 1 });
    } else {
      // inline
      barProps.height = RELATIVE_HEIGHT + "em";
      barProps.width ||= width || "3em";
      barProps.className = Config.Css.css({ verticalAlign: "middle" });
    }

    let boxClassName;
    if (onCancel || label || height) {
      boxClassName = Css.box({ height });
      boxAttrs = { className: boxClassName };

      if (onCancel) {
        const iconProps = {
          icon: "uugds-close",
          colorScheme: colorScheme ?? "primary",
          onClick: onCancel,
          tooltip: cancelTooltip,
          className: Css.icon({ height, size }),
        };

        if (label) {
          contentAfterHover = (
            <Icon
              {...iconProps}
              className={[
                iconProps.className,
                Css.opacity({ showOnHover: true, boxClassName }),
                Config.Css.css({ position: "absolute", left: 0 }),
              ].join(" ")}
            />
          );
        } else {
          contentAfter = <Icon {...iconProps} />;
        }
      }

      if (label) {
        barProps.elementAttrs ??= {};
        barProps.elementAttrs["aria-hidden"] = true;
        barProps.elementAttrs["aria-labelledby"] = labelId;

        if (height || onCancel) {
          contentAfter = (
            <span
              className={Utils.Css.joinClassName(
                Config.Css.css({
                  marginLeft: UuGds.SpacingPalette.getValue(["fixed", "b"]),
                  fontSize: height ? UuGds.SizingPalette.getValue(["relative", "l"], { height }) : undefined,
                }),
                onCancel ? Css.opacity({ showOnHover: false, boxClassName }) : undefined,
              )}
              id={labelId}
            >
              {label}
            </span>
          );
        } else {
          contentAfter = <>&nbsp;{label}</>;
        }
      }
    }

    let result = <Bar {...(!mainAttrs && !boxAttrs ? attrs : null)} {...barProps} />;

    if (boxAttrs) {
      if (!mainAttrs) {
        boxAttrs = {
          ...attrs,
          ...boxAttrs,
          className: Utils.Css.joinClassName(
            attrs.className,
            boxAttrs?.className,
            width ? Config.Css.css({ width }) : undefined,
          ),
          title: boxAttrs?.title ?? attrs.title,
        };
      }

      if (contentAfterHover) {
        contentAfter = (
          <div className={Css.contentAfterHover()}>
            {contentAfter}
            {contentAfterHover}
          </div>
        );
      }

      result = (
        <div {...boxAttrs}>
          {result}
          {contentAfter}
        </div>
      );
    }

    if (mainAttrs) {
      result = (
        <div
          {...mainAttrs}
          className={Utils.Css.joinClassName(mainAttrs.className, Css.main({ imageComponent, value }))}
        >
          {image}
          {result}
          <Text
            category="interface"
            segment="title"
            type="main"
            colorScheme="building"
            className={Css.text({ isMobile })}
          >
            {children}
          </Text>
        </div>
      );
    }

    //@@viewOn:render
    return result;
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { PendingHorizontal };
export default PendingHorizontal;
//@@viewOff:exports
