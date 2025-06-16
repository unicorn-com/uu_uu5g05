//@@viewOn:imports
import { createVisualComponent, PropTypes, useValueChange, Utils } from "uu5g05";
import CollapsibleBox from "./collapsible-box.js";
import Link from "./link.js";
import useSpacing from "./use-spacing.js";
import Box from "./box.js";
import Icon from "./icon.js";
import UuGds from "./_internal/gds.js";
import Config from "./config/config.js";
//@@viewOff:imports

//@@viewOn:constants
//@@viewOff:constants

//@@viewOn:css
const Css = {
  content: (padding) => Config.Css.css({ ...padding }),
  icon: () => Config.Css.css({ marginLeft: UuGds.SpacingPalette.getValue(["fixed", "c"]) }),
};
//@@viewOff:css

//@@viewOn:helpers
//@@viewOff:helpers

const LinkPanel = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "LinkPanel",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    header: PropTypes.node.isRequired,
    open: PropTypes.bool,
    onChange: PropTypes.func,
    colorScheme: PropTypes.colorScheme("building", "meaning", "basic"),
    significance: PropTypes.oneOf(["common", "subdued"]),
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    header: undefined,
    open: false,
    onChange: undefined,
    colorScheme: "building",
    significance: "common",
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { header, open, onChange, children, colorScheme, significance, ...otherProps } = props;
    const spacing = useSpacing();
    const [expanded, setExpanded] = useValueChange(
      open,
      typeof onChange === "function" ? (open) => onChange(new Utils.Event({ open })) : undefined,
    );

    const padding = { paddingTop: spacing.c, paddingBottom: spacing.c };
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const attrs = Utils.VisualComponent.getAttrs(otherProps);

    return (
      <div {...attrs}>
        <Link
          onClick={() => setExpanded((expanded) => !expanded)}
          colorScheme={colorScheme}
          significance={significance}
        >
          {header}
          <Icon className={Css.icon()} icon={expanded ? "uugds-chevron-up" : "uugds-chevron-down"} />
        </Link>
        <CollapsibleBox collapsed={!expanded} testId="collapsible-box">
          <div className={Css.content(typeof children !== "function" ? padding : {})}>
            {typeof children === "function" ? children({ style: padding }) : children}
          </div>
        </CollapsibleBox>
      </div>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { LinkPanel };
export default LinkPanel;
//@@viewOff:exports
