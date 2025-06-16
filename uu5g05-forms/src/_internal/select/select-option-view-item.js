//@@viewOn:imports
import { createVisualComponent, PropTypes, useDevice, Utils } from "uu5g05";
import { UuGds } from "uu5g05-elements";
import Config from "../../config/config.js";
import Checkbox from "../../checkbox.js";
import useHover from "../use-hover.js";
//@@viewOff:imports

//@@viewOn:constants
const CONTAINER_SIZE_MAP_MOBILE = {
  xxs: "xs",
  xs: "s",
  s: "m",
  m: "l",
  l: "l",
  xl: "xl",
};
//@@viewOff:constants

//@@viewOn:css
const Css = {
  main: ({ containerSize }) => {
    const { height } = UuGds.getSizes("spot", "basic", containerSize);

    return Config.Css.css({
      width: "100%",
      height: "100%",
      display: "flex",
      alignItems: "center",
      gap: UuGds.getValue(["SpacingPalette", "inline", "d"]),
      paddingLeft: UuGds.SpacingPalette.getValue(["relative", "d"], { height }),
      paddingRight: UuGds.SpacingPalette.getValue(["relative", "d"], { height }),
    });
  },
  checkbox: ({ withoutCheckbox }) =>
    Config.Css.css({
      visibility: withoutCheckbox ? "hidden" : "visible",
    }),
};
//@@viewOff:css

//@@viewOn:helpers
//@@viewOff:helpers

const SelectOptionViewItem = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "SelectOptionViewItem",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    selected: PropTypes.bool,
    size: PropTypes.oneOf(Object.keys(CONTAINER_SIZE_MAP_MOBILE)),
    hideCheckbox: PropTypes.bool,
    single: PropTypes.bool,
    colorScheme: PropTypes.colorScheme,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    selected: false,
    size: "m",
    hideCheckbox: false,
    single: false,
    colorScheme: "primary",
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { id, children, selected, disabled, readOnly, size, hideCheckbox, single, colorScheme } = props;
    const withoutCheckbox = disabled || readOnly || hideCheckbox;

    const [isHovered, hoverRef] = useHover(withoutCheckbox);
    const { isMobileOrTablet } = useDevice();
    const containerSize = (isMobileOrTablet && CONTAINER_SIZE_MAP_MOBILE[size]) || size;
    //@@viewOff:private

    //@@viewOn:render
    const attrs = Utils.VisualComponent.getAttrs(props, Css.main({ containerSize, withoutCheckbox }));

    const CheckboxComponent = single ? Checkbox.RadioInput : Checkbox.Input;

    return (
      <div {...attrs} ref={hoverRef}>
        <CheckboxComponent
          id={`checkbox-${id}`}
          icon={selected || isHovered ? "uugds-check" : undefined}
          colorScheme={selected ? colorScheme : "dim"}
          size={size}
          className={Css.checkbox({ withoutCheckbox })}
          value={selected || isHovered}
          elementAttrs={{ tabIndex: "-1" }} // no focus on this compnent
        />
        {children}
      </div>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { SelectOptionViewItem };
export default SelectOptionViewItem;
//@@viewOff:exports
