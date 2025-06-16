import { UuGds } from "uu5g05-elements";
import Config from "../config/config.js";

const Css = {
  popover: () => {
    return Config.Css.css({
      display: "flex",
    });
  },
  datePicker: ({ isRow, isPreset }) =>
    Config.Css.css({
      display: "flex",
      flexDirection: isRow ? "row" : "column",
      gap: UuGds.SpacingPalette.getValue(["fixed"]).e,
      ...(isPreset && { flex: "0 1 504px", minHeight: 0 }),
    }),
  datePresets: ({ isRow }) =>
    Config.Css.css({
      marginTop: isRow ? UuGds.SpacingPalette.getValue(["fixed"]).c : 0,
      order: isRow ? 0 : 1,
    }),
  calendar: ({ isPreset, isHorizontal, height = 504 }) => {
    const padding = UuGds.SpacingPalette.getValue(["fixed"]).e;
    const styles = {
      paddingRight: padding,
      paddingLeft: padding,
      display: "flex",
      flex: `0 1 ${height}px`,
      minHeight: 0,
    };

    if (isPreset || isHorizontal) {
      styles.flex = "0 1 auto";
      if (isHorizontal) {
        styles.paddingTop = padding;
        styles.paddingBottom = padding;
      }
    }

    return Config.Css.css(styles);
  },
  basicDatePicker: () => {
    const padding = UuGds.SpacingPalette.getValue(["fixed"]).e;
    return Config.Css.css({
      paddingRight: padding,
      paddingLeft: padding,
      "&>div": {
        minWidth: 180,
      },
    });
  },
};

export default Css;
