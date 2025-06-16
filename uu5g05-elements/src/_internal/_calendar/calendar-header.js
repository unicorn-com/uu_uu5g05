//@@viewOn:imports
import { createVisualComponent, PropTypes, useLanguage, Utils } from "uu5g05";
import { UuDate } from "uu_i18ng01";
import UuGds from "../gds";
import Button from "../../button.js";
import Config from "../../config/config.js";
import Text from "../../text.js";
import Link from "../../link";
import importLsi from "../../lsi/import-lsi.js";
//@@viewOff:imports

const CalendarHeader = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "CalendarHeader",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    displayDate: PropTypes.object, // UuDate format
    interactive: PropTypes.bool,
    picker: PropTypes.oneOf(["day", "month", "year"]),
    dateFrom: PropTypes.string,
    dateTo: PropTypes.string,
    onIncreaseDate: PropTypes.func,
    onMinimizeDate: PropTypes.func,
    onDecreaseDate: PropTypes.func,
    onSelect: PropTypes.func,
    selectionMode: PropTypes.oneOf(["single", "range"]),
    selectionType: PropTypes.oneOf(["day", "week"]),
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    interactive: true,
    selectionMode: "single",
    selectionType: "day",
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const {
      displayDate: propsDisplayDate,
      interactive,
      picker,
      dateFrom: propsDateFrom,
      dateTo: propsDateTo,
      onIncreaseDate: propsOnIncreaseDate,
      onMinimizeDate: propsOnMinimizeDate,
      onDecreaseDate: propsOnDecreaseDate,
      selectionMode,
      selectionType,
    } = props;

    const displayDate = new UuDate(propsDisplayDate);
    const [language] = useLanguage();
    const { h: height } = UuGds.getValue(["SizingPalette", "spot", "basic", "s"]);
    const dateFrom = propsDateFrom ? new UuDate(propsDateFrom).startOfMonth() : undefined;
    const dateTo = propsDateTo ? new UuDate(propsDateTo).endOfMonth() : undefined;

    const onDecreaseDate = (e) => {
      if (typeof propsOnDecreaseDate === "function") {
        propsOnDecreaseDate(e);
      }
    };
    const onMinimizeDate = (e) => {
      if (typeof propsOnMinimizeDate === "function") {
        propsOnMinimizeDate(e);
      }
    };
    const onIncreaseDate = (e) => {
      if (typeof propsOnIncreaseDate === "function") {
        propsOnIncreaseDate(e);
      }
    };

    const isLeftArrowDisabled = () => {
      let displayedDate = new UuDate(displayDate);
      if (picker === "day") {
        return dateFrom && UuDate.compare(displayedDate.startOfMonth().startOfWeek().shiftDay(-1), dateFrom) < 0;
      } else if (picker === "month") {
        displayedDate.startOfYear();
        return dateFrom && UuDate.compare(displayedDate.startOfYear(), dateFrom) <= 0;
      }
      return (
        dateFrom &&
        UuDate.compare(displayedDate.setYear(getDecade(displayedDate.getYear())).startOfYear(), dateFrom) < 0
      );
    };

    const isRightArrowDisabled = () => {
      let displayedDate = new UuDate(displayDate);
      if (picker === "day") {
        return dateTo && UuDate.compare(displayedDate.shiftMonth(1).endOfMonth(), dateTo) > 0;
      } else if (picker === "month") {
        displayedDate.endOfYear();
        return dateTo && UuDate.compare(displayedDate, dateTo) >= 0;
      }
      return (
        dateTo &&
        UuDate.compare(displayedDate.setYear(getDecade(displayedDate.getYear()) + 11).startOfYear(), dateTo) > 0
      );
    };
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const getTitle = () => {
      let title;
      if (picker === "day") {
        title = displayDate.format(language, { format: "MMMM YYYY" });
      } else if (picker === "month") {
        title = displayDate.getYear();
      } else {
        let decade = getDecade(displayDate.getYear());
        title = `${decade} - ${decade + 11}`;
      }

      const onSelect = () => {
        const startDate = displayDate.startOfMonth().toIsoString();
        const endDate = displayDate.endOfMonth().toIsoString();

        const dates = {
          data: { value: [startDate, endDate] },
        };
        props.onSelect(dates, true);
      };

      return (
        <Text category="interface" segment="title" type="micro">
          {({ style }) =>
            selectionMode == "range" && selectionType !== "week" ? (
              <Link
                colorScheme="building"
                onClick={onSelect}
                tooltip={{ import: importLsi, path: ["Calendar", "selectMonth"] }}
                className={Utils.Css.joinClassName(
                  CLASS_NAMES.capitalizeText(height, interactive),
                  Config.Css.css(style),
                )}
              >
                {title}
              </Link>
            ) : (
              <Text
                colorScheme="building"
                className={Utils.Css.joinClassName(
                  CLASS_NAMES.capitalizeText(height, interactive),
                  Config.Css.css(style),
                )}
              >
                {title}
              </Text>
            )
          }
        </Text>
      );
    };

    return (
      <>
        {!interactive ? (
          getTitle()
        ) : (
          <div className={CLASS_NAMES.container(height, interactive)}>
            <Button
              onClick={onDecreaseDate}
              icon="uugds-chevron-left"
              size="s"
              significance="subdued"
              borderRadius="moderate"
              disabled={isLeftArrowDisabled()}
              elementAttrs={{ "aria-label": "previous" }}
            />
            {picker === "year" ? (
              getTitle()
            ) : (
              <Button
                onClick={onMinimizeDate}
                iconRight="uugds-menu-down"
                significance="subdued"
                colorScheme="building"
                size="s"
                borderRadius="moderate"
              >
                {getTitle()}
              </Button>
            )}
            <Button
              onClick={onIncreaseDate}
              icon="uugds-chevron-right"
              size="s"
              significance="subdued"
              borderRadius="moderate"
              disabled={isRightArrowDisabled()}
              elementAttrs={{ "aria-label": "next" }}
            />
          </div>
        )}
      </>
    );
    //@@viewOff:render
  },
});

//@@viewOn:helpers
const getDecade = (year) => {
  return Math.floor(year / 10) * 10;
};

const CLASS_NAMES = {
  container: (height, interactive) =>
    Config.Css.css({
      height,
      display: "flex",
      justifyContent: interactive ? "space-between" : "center",
      width: "100%",
    }),
  capitalizeText: (height, interactive) =>
    Config.Css.css({
      textTransform: "capitalize",
      display: "flex",
      alignItems: "center",
      userSelect: "none",
      lineHeight: `${height}px !important`,
      justifyContent: interactive ? "space-between" : "center",
    }),
};
//@@viewOff:helpers

export { CalendarHeader };
export default CalendarHeader;
