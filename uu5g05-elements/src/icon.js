//@@viewOn:imports
import { createVisualComponent, Utils, PropTypes, useLayoutEffect, useBackground, useLanguage } from "uu5g05";
import Config from "./config/config.js";
import withTooltip from "./with-tooltip.js";
import Text from "./text.js";
import { iconLibraryMap } from "./uu5-environment.js";

//@@viewOff:imports

const COLORED_REGEXP = new RegExp(
  `(^uubml-state-s\\d+-[a-z-]+$|^(uubml|uubmlicon)-.*-(${PropTypes.COLOR_SCHEME.priority.join("|")})$)`,
);
let warnedIcon;

const Css = {
  main: ({ icon, colorScheme, isColored, animation }) => {
    let uubmlStyles;
    let animationStyles;

    if (icon.startsWith("uubml-") || icon.startsWith("uubmlicon-")) {
      uubmlStyles = {
        verticalAlign: "-0.2em", // must be because uubml icon is displayed at the top of the text :-(
      };

      if (!isColored) {
        uubmlStyles = {
          ...uubmlStyles,
          "&&&.uubml::before, &&&.uubmlicon::before": { color: "transparent" },
          "&&.uubml::after, &&.uubmlicon::after": colorScheme ? { color: "inherit" } : undefined,
        };
      }
    } else if (colorScheme && !isColored) {
      let prefix = icon.split("-")[0];
      if (prefix) {
        uubmlStyles = {
          [`&&&.${prefix}::before`]: { color: "inherit" },
        };
      }
    }

    if (animation === "rotate") {
      let keyframes = Config.Css.keyframes({
        "0%": { transform: "rotate(0deg)" },
        "100%": { transform: "rotate(360deg)" },
      });
      const duration = 1000; // TODO after release of MotionPalette in uuGds: MotionPalette.getValue(["duration", "i"]);
      animationStyles = `${keyframes} ${duration}ms infinite linear`;
    }

    return Config.Css.css({
      display: "inline-block",
      lineHeight: 1,
      animation: animationStyles,
      // if icon is set, this span should be rectangle
      ...(icon ? { minWidth: "1em", minHeight: "1em" } : null),
      ...uubmlStyles,
    });
  },
};

const UtilsIcon = {
  cache: [],

  getClassName(icon) {
    let [libraryName, stencil] = icon.split("-");
    const classNames = [libraryName];

    if (iconLibraryMap[libraryName]?.includes("%s")) {
      classNames.push([libraryName, stencil].join("-"));
    }

    classNames.push(icon);

    return classNames.join(" ");
  },

  addLibrary(icon) {
    let [libraryName, stencil] = icon.split("-");
    let libraryUri = iconLibraryMap[libraryName];

    if (libraryUri) {
      if (libraryUri.includes("%s")) {
        libraryName = [libraryName, stencil].join("-");
        libraryUri = Utils.String.format(libraryUri, stencil);
      }

      if (!UtilsIcon.cache.includes(libraryName)) {
        // link icon CSS to the beginning of <head> instead of at the end - it's a performance
        // optimization because whenever we later insert dynamic (emotion) CSS style, Chrome will
        // recalculate all selectors that are after the <style> element where dynamic style got
        // inserted (and icons tends to have *many* selectors so they slow this down, e.g. uubml icons
        // with 100ms after each reflow; they also have a specific prefix, e.g. ".mdi"
        // without interfering with other icons so inserting at the beginning should be fine)
        const done = Utils.Dom.addCss(libraryUri, true);
        if (done) UtilsIcon.cache.push(libraryName);
      }
    } else if (process.env.NODE_ENV !== "production" && (!warnedIcon || !warnedIcon.has(icon))) {
      warnedIcon ??= new Set();
      warnedIcon.add(icon);
      Icon.logger.warn(
        `Unknown icon '${icon}' - the icon library URL is not configured in uu5Environment.uu5g05_iconLibraryMap["${libraryName}"]`,
      );
    }
  },
};

const Icon = withTooltip(
  createVisualComponent({
    //@@viewOn:statics
    uu5Tag: Config.TAG + "Icon",
    //@@viewOff:statics

    //@@viewOn:propTypes
    propTypes: {
      icon: PropTypes.icon,
      tooltip: PropTypes.string,
      margin: PropTypes.space,
      onClick: PropTypes.func,
      colorScheme: PropTypes.colorScheme,
      significance: PropTypes.oneOf(["common", "subdued"]),
      animation: PropTypes.oneOf(["rotate", "none"]),
    },
    //@@viewOff:propTypes

    //@@viewOn:defaultProps
    defaultProps: {
      icon: "uugds-react",
      tooltip: undefined,
      margin: undefined,
      onClick: undefined,
      colorScheme: undefined,
      significance: "common",
      animation: "none",
    },
    //@@viewOff:defaultProps

    render(props) {
      //@@viewOn:private
      let { icon: propsIcon, margin, onClick, colorScheme, children: propsChildren, animation } = props;

      let dynamicStyles;
      let children = propsChildren;
      let icon = propsIcon;

      if (icon === "empty") {
        icon = Icon.defaultProps.icon;
        dynamicStyles = { ...dynamicStyles, "&:before": { visibility: "hidden" } };
      }

      if (Utils.Element.isValid(propsIcon) && !children) {
        children = icon;
        icon = "";
        dynamicStyles = { ...dynamicStyles, display: "inline-flex" };
      }

      // TODO use useInsertionEffect (able from react 18)
      useLayoutEffect(() => {
        icon && UtilsIcon.addLibrary(icon);
      }, [icon]);

      const [, , { direction } = {}] = useLanguage();

      const isColored = COLORED_REGEXP.test(icon);
      const classNames = [Css.main({ ...props, icon, isColored, animation })];

      if (margin) dynamicStyles = { ...dynamicStyles, ...Utils.Style.parseSpace(margin, "margin") };
      if (onClick) dynamicStyles = { ...dynamicStyles, cursor: "pointer" };
      dynamicStyles && classNames.push(Config.Css.css(dynamicStyles));

      const background = useBackground(props.background); // TODO Next major - remove props.background.
      if (!isColored && colorScheme) {
        classNames.push(
          Config.Css.css(
            Text._getColorStyles({
              ...props,
              background,
              hoverable: !!onClick,
            }),
          ),
        );
      }

      if (icon) classNames.push(UtilsIcon.getClassName(icon));
      //@@viewOff:private

      //@@viewOn:interface
      //@@viewOff:interface

      //@@viewOn:render
      let attrs = Utils.VisualComponent.getAttrs(props, classNames.join(" "));

      if (typeof onClick === "function") {
        attrs.role = "button";
      }

      return (
        <span dir={direction} {...attrs} onClick={onClick}>
          {children}
        </span>
      );
      //@@viewOff:render
    },
  }),
);

//@@viewOn:helpers
//@@viewOff:helpers

export { Icon };
export default Icon;
