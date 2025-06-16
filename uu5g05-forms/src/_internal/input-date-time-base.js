//@@viewOn:imports
import { createComponent, PropTypes, useDevice, useScreenSize, Utils } from "uu5g05";
import { Grid, Input, UuGds } from "uu5g05-elements";
import Config from "../config/config.js";
import DateInput from "../inputs/date-input.js";
import TimeInput from "../inputs/time-input.js";
import useBrowserHourFormat from "./use-browser-hour-format.js";
//@@viewOff:imports

//@@viewOn:constants
const CONTAINER_SIZE_MAP_MOBILE = Input._CONTAINER_SIZE_MAP_MOBILE;
const DATE_PROPS = {
  pickerType: "vertical",
  width: "100%",
  displayNavigation: false,
};
const TIME_PROPS = {
  pickerType: "vertical",
  width: "100%",
};
const DATE_TIME_PROPTYPES = getDateTimePropTypes();

const SECONDS_OFFSET = 3;
const TWELVE_HOUR_FORMAT = 3.5;
//@@viewOff:constants

//@@viewOn:css
const Css = {
  main: ({ width }) =>
    Config.Css.css({
      width,
    }),
};
//@@viewOff:css

//@@viewOn:helpers
function getDateTimePropTypes() {
  const { pickerType, width, displayNavigation, ...datePropTypes } = DateInput.propTypes;
  const {
    pickerType: timePickerType,
    width: timeWidth,
    format,
    displaySeconds,
    ...timePropTypes
  } = TimeInput.propTypes;

  return { datePropTypes, timePropTypes };
}

function getGridTemplateColumn(size, screenSize, offset = 0) {
  let sizes;

  if (screenSize === "xs") {
    sizes = {
      xxs: `minmax(12ch, 100%) minmax(${8.5 + offset}ch, ${9 + offset}ch)`,
      xs: `minmax(14ch, 100%) minmax(${9.5 + offset}ch, ${10 + offset}ch)`,
      s: `minmax(16.5ch, 100%) minmax(${11.5 + offset}ch, ${12 + offset}ch)`,
      m: `minmax(17.5ch, 100%) minmax(${11.5 + offset}ch, ${12 + offset}ch)`,
      l: `minmax(19.5ch, 100%) ${13 + offset}ch`,
      xl: `minmax(21.5ch, 100%) minmax(${13.5 + offset}ch, ${14.5 + offset}ch)`,
    };
  } else {
    sizes = {
      xxs: `minmax(13ch, 100%) ${9 + offset}ch`,
      xs: `minmax(15ch, 100%) ${10.5 + offset}ch`,
      s: `minmax(17.5ch, 100%) ${12 + offset}ch`,
      m: `minmax(18.5ch, 100%) minmax(${12.5 + offset}ch, ${13 + offset}ch)`,
      l: `minmax(20.5ch, 100%) minmax(${14 + offset}ch, ${15 + offset}ch)`,
      xl: `minmax(22.5ch, 100%) minmax(${14.5 + offset}ch, ${15.5 + offset}ch)`,
    };
  }

  return sizes[size];
}

function getTimeOffset(isSeconds, isTwelveHourFormat) {
  let offset = 0;
  if (isSeconds) offset += SECONDS_OFFSET;
  if (isTwelveHourFormat) offset += TWELVE_HOUR_FORMAT;

  return offset;
}
//@@viewOff:helpers

const InputDateTimeBase = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "InputDateTimeBase",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    dateProps: PropTypes.shape({ ...DateInput.propTypes }),
    timeProps: PropTypes.shape({ ...TimeInput.propTypes }),
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    dateProps: {},
    timeProps: {},
    size: "m",
    width: "min-content",
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { dateProps, timeProps, width, elementRef, ...otherProps } = props;
    const { size } = otherProps;

    const { isMobileOrTablet } = useDevice();
    const [screenSize] = useScreenSize();
    const browserHourFormat = useBrowserHourFormat();
    const containerSize = (isMobileOrTablet && CONTAINER_SIZE_MAP_MOBILE[size]) || size;
    const { h: height } = UuGds.getValue(["SizingPalette", "spot", "basic", containerSize]);
    //@@viewOff:private

    //@@viewOn:render
    const {
      elementProps: { disabled, ...elementProps },
      componentProps,
    } = Utils.VisualComponent.splitProps(otherProps, Css.main({ width }));

    return (
      <Grid
        {...elementProps}
        templateColumns={getGridTemplateColumn(
          size,
          screenSize,
          getTimeOffset(timeProps.displaySeconds, browserHourFormat === 12 || timeProps.format === 12),
        )}
        columnGap={UuGds.getValue(["SpacingPalette", "relative", "b"]) * height}
        display="inline"
      >
        <DateInput
          {...componentProps}
          {...DATE_PROPS}
          {...dateProps}
          disabled={disabled || dateProps.disabled}
          elementRef={Utils.Component.combineRefs(elementRef, dateProps.elementRef)}
          placeholder={dateProps.placeholder}
          feedbackIcon={null}
        />
        <TimeInput
          {...componentProps}
          {...TIME_PROPS}
          {...timeProps}
          disabled={disabled || timeProps.disabled}
          placeholder={timeProps.placeholder}
          clearIcon={null}
        />
      </Grid>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { InputDateTimeBase, DATE_TIME_PROPTYPES };
export default InputDateTimeBase;
//@@viewOff:exports
