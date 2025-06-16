//@@viewOn:imports
import { createVisualComponent, Utils, PropTypes, useStickyTop } from "uu5g05";
import Config from "../config/config.js";
import ActionGroup from "../action-group.js";
import UuGds from "./gds";
import Dropdown from "../dropdown";
import Button from "../button";
//@@viewOff:imports

const Css = {
  main() {
    return Config.Css.css({
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "nowrap",
    });
  },
  actionLeft() {
    return Config.Css.css({
      "&&": {
        flex: 0,
        marginRight: UuGds.getValue(["SpacingPalette", "fixed", "c"]),
      },
    });
  },
  actionGroup() {
    return Config.Css.css({
      flex: "1 0 0%",
      margiLeft: UuGds.getValue(["SpacingPalette", "fixed", "c"]),
    });
  },
};

const Bar = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Bar",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    actionList: PropTypes.array,
    actionCollapsedMenuProps: ActionGroup.propTypes.collapsedMenuProps,
    fixed: PropTypes.oneOf(["always", "onScrollUp"]),
    actionLeft: PropTypes.object,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    actionLeft: undefined,
    actionList: undefined,
    actionCollapsedMenuProps: undefined,
    fixed: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    let { actionLeft, actionList, fixed, children, actionCollapsedMenuProps } = props;
    const hasRight = Array.isArray(actionList) && actionList.length > 0;

    //@@viewOff:private

    //@@viewOn:render
    const attrs = Utils.VisualComponent.getAttrs(props, hasRight ? Css.main() : undefined);

    let Comp = "div";
    if (fixed) {
      Comp = FixedBar;
      attrs.fixed = fixed;
      attrs.elementRef = props.elementRef;
    } else {
      attrs.ref = props.elementRef;
    }

    return (
      <Comp {...attrs}>
        {actionLeft && <ActionLeft {...actionLeft} />}
        {children}
        {hasRight ? (
          <ActionGroup
            className={Css.actionGroup()}
            itemList={actionList}
            collapsedMenuProps={actionCollapsedMenuProps}
          />
        ) : null}
      </Comp>
    );
    //@@viewOff:render
  },
});

//@@viewOn:helpers
function ActionLeft(actionLeft) {
  const Component = actionLeft.itemList ? Dropdown : Button;
  const actionProps = {
    ...actionLeft,
    colorScheme: actionLeft.colorScheme ?? "dim",
    significance: actionLeft.significance ?? "subdued",
    className: Utils.Css.joinClassName(Css.actionLeft(), actionLeft.className),
  };

  return <Component {...actionProps} />;
}

function FixedBar(props) {
  const { fixed, children, ...attrs } = props;

  const { ref, style } = useStickyTop(fixed);

  return (
    <div {...attrs} ref={ref} style={attrs.style ? { ...attrs.style, ...style } : style}>
      {children}
    </div>
  );
}

//@@viewOff:helpers

export default Bar;
