//@@viewOn:imports
import { createVisualComponent, PropTypes, useDevice, useScreenSize, useState, Utils } from "uu5g05";
import Config from "../config/config";
import UuGds from "../_internal/gds";
import Spinner from "./spinner";
import Icon from "../icon";
import Text from "../text";
import Svg from "../svg";
//@@viewOff:imports

//@@viewOn:css
const Css = {
  main: () =>
    Config.Css.css({
      display: "inline-flex",
      flexDirection: "column",
      alignItems: "center",
    }),
  box: ({ height }) =>
    Config.Css.css({
      position: "relative",
      display: height ? "inline-block" : "inline-flex",
      verticalAlign: height ? undefined : "middle",
      aspectRatio: "1/1",
      height: height ?? "1em",
    }),
  inside: ({ height, fontSize }) => {
    return Config.Css.css({
      position: "absolute",
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      display: "flex!important",
      alignItems: "center",
      justifyContent: "center",
      fontSize: fontSize ?? UuGds.SizingPalette.getValue(["relative", "l"], { height }) + (height ? "px" : "em"),
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
  iconBg: (otherStyles = {}) =>
    Config.Css.css({
      position: "absolute",
      left: 0,
      top: 0,
      right: 0,
      bottom: 0,
      width: "100%",
      height: "100%",
      ...otherStyles,
    }),
};
//@@viewOff:css

const PendingCircular = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "PendingCircular",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    size: PropTypes.oneOfType([PropTypes.oneOf(["xxs", "xs", "s", "m", "l", "xl", "max"]), PropTypes.number]),
    colorScheme: Spinner.propTypes.colorScheme,
    progressColor: Spinner.propTypes.progressColor,
    onCancel: PropTypes.func,
    cancelTooltip: PropTypes.lsi,
    imageSrc: PropTypes.string,
    icon: PropTypes.string,
    value: Spinner.propTypes.progress,
    label: PropTypes.node,
    animated: Spinner.propTypes.animated,
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

    const { elementAttrs, elementProps } = Utils.VisualComponent.splitProps(props);

    let mainAttrs;
    let boxAttrs;
    let inner, innerHover, labelAfter, iconBg;
    let spinnerProps = { colorScheme, progressColor, progress: value, animated };

    let height;
    if (size === "max") {
      height = UuGds.SizingPalette.getValue(["box", "1x1", isMobile ? "s" : "m"]).h;
      spinnerProps.height = height;
      spinnerProps.progressWidth = 6;
      if (children) mainAttrs = elementAttrs;
    } else if (typeof size === "number") {
      height = size;
      spinnerProps.height = height;
      spinnerProps.progressWidth = 4 * (height / UuGds.SizingPalette.getValue(["box", "1x1", "xs"]).h);
      if (children) mainAttrs = elementAttrs;
    } else if (size) {
      height = UuGds.SizingPalette.getValue(["spot", "basic", size]).h;
      spinnerProps.style = { height };
    } else {
      // inline
      spinnerProps.style = { height: "1em" };
    }

    if (onCancel || label) {
      const boxClassName = Css.box({ height });
      boxAttrs = { className: boxClassName };

      if (onCancel) {
        const iconProps = {
          icon: "uugds-close",
          colorScheme: colorScheme ?? "primary",
          onClick: onCancel,
          tooltip: cancelTooltip,
          className: Css.inside({ height }),
        };

        if (label && height) {
          innerHover = (
            <Icon
              {...iconProps}
              className={[iconProps.className, Css.opacity({ showOnHover: true, boxClassName })].join(" ")}
            />
          );
        } else {
          inner = <Icon {...iconProps} />;
        }
      }

      if (label) {
        spinnerProps.elementAttrs ??= {};
        spinnerProps.elementAttrs["aria-hidden"] = true;
        spinnerProps.elementAttrs["aria-labelledby"] = labelId;

        if (height) {
          inner = (
            <span
              className={Utils.Css.joinClassName(
                Css.inside({ height, fontSize: height }),
                onCancel ? Css.opacity({ showOnHover: false, boxClassName }) : undefined,
              )}
              id={labelId}
            >
              {label}
            </span>
          );
        } else {
          labelAfter = <>&nbsp;{label}</>;
        }
      }
    } else if (imageSrc || imageComponent) {
      boxAttrs = {
        className: Config.Css.css({
          display: "inline-block",
          verticalAlign: "top",
          overflow: "hidden",
          borderRadius: "50%",
          position: "relative",
        }),
      };
      if (imageSrc) {
        iconBg = <img src={imageSrc} className={Css.iconBg({ objectFit: "scale-down" })} alt="Pending image" />;
      } else {
        iconBg = (
          <div className={Css.iconBg({ display: "flex", justifyContent: "center", alignItems: "center" })}>
            {imageComponent}
          </div>
        );
      }
    } else if (icon) {
      boxAttrs = { className: Css.box({ height }) };

      iconBg = (
        <Svg
          code={icon}
          colorScheme={colorScheme ?? "primary"}
          height={height}
          className={Config.Css.css({ position: "absolute" })}
          testId="svg"
        />
      );
    }

    if (!mainAttrs && !boxAttrs) {
      spinnerProps = {
        ...elementProps,
        ...spinnerProps,
        style: {
          ...(typeof elementProps.style === "string" ? Utils.Style.parse(elementProps.style) : elementProps.style),
          ...spinnerProps.style,
        },
      };
    }
    let result = <Spinner {...spinnerProps} />;

    if (boxAttrs) {
      if (!mainAttrs) {
        boxAttrs = {
          ...elementAttrs,
          ...boxAttrs,
          className: Utils.Css.joinClassName(elementAttrs.className, boxAttrs?.className),
          title: boxAttrs?.title ?? elementAttrs.title,
        };
      }

      result = (
        <div {...boxAttrs}>
          {iconBg}
          {result}
          {inner}
          {innerHover}
        </div>
      );
    }

    if (mainAttrs)
      result = (
        <div {...mainAttrs} className={Utils.Css.joinClassName(mainAttrs.className, Css.main())}>
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

    //@@viewOn:render
    return (
      <>
        {result}
        {labelAfter}
      </>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { PendingCircular };
export default PendingCircular;
//@@viewOff:exports
