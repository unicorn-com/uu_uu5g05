//@@viewOn:imports
import { createVisualComponent, useLanguage, PropTypes } from "uu5g05";
import { UuDate } from "uu_i18ng01";
import UuGds from "../gds";
import Config from "../../config/config.js";
import Text from "../../text.js";
//@@viewOff:imports

const DayLabels = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "DayLabels",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    isWeekNumberDisplayed: PropTypes.bool, // If week numbers are hidden, remove left paddings
    weekStartDay: PropTypes.number,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { weekStartDay } = props;
    const gap = UuGds.SpacingPalette.getValue(["fixed"]).b;
    const [language] = useLanguage();
    const { h: height } = UuGds.getValue(["SizingPalette", "spot", "basic", "xs"]);
    const { h: width } = UuGds.getValue(["SizingPalette", "spot", "basic", "s"]);
    const date = new UuDate().startOfWeek();

    date.shiftDay(weekStartDay - 1);

    const getWeekDays = () => {
      const weekdays = [];

      for (let i = 0; i < 7; i++) {
        weekdays.push(
          <Text
            key={i}
            className={CLASS_NAMES.weekday(width, height)}
            category={"interface"}
            segment={"content"}
            type={"small"}
            colorScheme="building"
            significance="subdued"
          >
            {date.format(language, { format: "dd" })}
          </Text>,
        );
        date.shiftDay(1);
      }
      return weekdays;
    };
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      <div className={CLASS_NAMES.container(props.isWeekNumberDisplayed, height, gap)} data-testid="week-days">
        {getWeekDays()}
      </div>
    );
    //@@viewOff:render
  },
});

//@@viewOn:helpers
const CLASS_NAMES = {
  container: (isWeekNumberDisplayed, itemWidth, gap) =>
    Config.Css.css({
      display: "grid",
      grid: "auto / auto auto auto auto auto auto auto",
      gridGap: UuGds.SpacingPalette.getValue(["fixed"]).b,
      paddingLeft: isWeekNumberDisplayed ? itemWidth + gap : undefined,
      marginBottom: gap,
      justifyItems: "center",
    }),
  weekday: (width, height) =>
    Config.Css.css({
      textTransform: "capitalize",
      width,
      height,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      userSelect: "none",
    }),
};
//@@viewOff:helpers

export { DayLabels };
export default DayLabels;
