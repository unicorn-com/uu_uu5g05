//@@viewOn:imports
import { createVisualComponent, PropTypes, useLanguage, useTimeZone, useUserPreferences, Utils } from "uu5g05";
import { UuDateTime } from "uu_i18ng01";
import Config from "./config/config.js";
import Tools from "./_internal/tools.js";
//@@viewOff:imports

//@@viewOn:constants
const TIME_FORMAT_MAP = {
  short: { 11: "K:mm a", 12: "h:mm a", 24: "H:mm" },
  medium: { 11: "KK:mm a", 12: "hh:mm a", 24: "HH:mm" },
  long: { 11: "KK:mm:ss a", 12: "hh:mm:ss a", 24: "HH:mm:ss" },
};
//@@viewOff:constants

//@@viewOn:helpers
//@@viewOff:helpers

const DateTime = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "DateTime",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    dateFormat: PropTypes.oneOf(["none", "short", "medium", "long"]),
    timeFormat: PropTypes.oneOf(["none", "short", "medium", "long"]),
    hourFormat: PropTypes.oneOf([11, 12, 24]),
    format: PropTypes.string,
    timeZone: PropTypes.string,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    value: undefined,
    dateFormat: "medium",
    timeFormat: "medium",
    hourFormat: undefined, // 24
    format: undefined,
    timeZone: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { value, dateFormat, timeFormat, hourFormat, format: propsFormat, timeZone: propsTimeZone } = props;

    const [timeZone] = useTimeZone();
    const [pref] = useUserPreferences();
    const [language] = useLanguage();

    let format = propsFormat;
    if (!format) {
      const formatList = [];
      if (dateFormat !== "none" && pref[dateFormat + "DateFormat"]) {
        formatList.push(pref[dateFormat + "DateFormat"]);
      }
      if (timeFormat !== "none") formatList.push(TIME_FORMAT_MAP[timeFormat][hourFormat || pref.hourFormat || 24]);
      format = formatList.join(" ");
    }
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const dateTime = new UuDateTime(value, propsTimeZone || timeZone).format(language, { format });

    const visualComponentProps = Tools.ensureVisualComponentDefinedProps(props);
    if (visualComponentProps) {
      //Note: there is property from visual component, dateTime must be wrapped with element
      const attrs = Utils.VisualComponent.getAttrs(visualComponentProps);

      return <span {...attrs}>{dateTime}</span>;
    }

    return dateTime;
    //@@viewOff:render
  },
});

export { DateTime };
export default DateTime;
