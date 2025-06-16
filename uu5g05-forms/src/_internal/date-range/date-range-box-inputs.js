//@@viewOn:imports
import {
  createVisualComponent,
  Utils,
  useBackground,
  useDevice,
  useRef,
  useEffect,
  useLanguage,
  PropTypes,
} from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import useMeasureRangeInputWidths from "../use-measure-range-input-widths.js";
import NativeDateInput from "../../_native/date/input.js";
import Config from "../../config/config.js";
import useDateTimeFormat from "../../use-date-time-format.js";
//@@viewOff:imports

//@@viewOn:constants
const CONTAINER_SIZE_MAP_MOBILE = Uu5Elements.Input._CONTAINER_SIZE_MAP_MOBILE;
const TEXT_TYPE_MAP_MOBILE = Uu5Elements.Input._TEXT_TYPE_MAP_MOBILE;
const TEXT_TYPE_MAP = Uu5Elements.Input._TEXT_TYPE_MAP;

const DEFAULT_STYLES = {
  position: "relative",
  display: "inline-flex",
  alignItems: "safe center",
  outline: "none",
  overflow: "hidden",
  minWidth: 0,
  gap: 2,
};
//@@viewOff:constants

//@@viewOn:css
const Css = {
  main: ({ width, type, padding: propsPadding, shapeStyles, focus, ...otherProps }) => {
    let { padding, ...inputBoxStyles } = Uu5Elements.Input._getInputStyles(otherProps);
    inputBoxStyles.paddingLeft = inputBoxStyles.paddingRight = padding;
    if (propsPadding) inputBoxStyles = { ...inputBoxStyles, ...Utils.Style.parseSpace(propsPadding, "padding") };
    width != null && width !== "auto" && (inputBoxStyles.width = width);

    let dynamicStyles = {};
    if (focus) {
      const states = Uu5Elements.UuGds.getValue([
        "Shape",
        "formElement",
        otherProps.background,
        otherProps.colorScheme,
        otherProps.significance,
      ]);
      const focusStyles = Uu5Elements.UuGds.Shape.getStateStyles(states.marked);
      dynamicStyles = { ...dynamicStyles, ...focusStyles };
    }

    return [DEFAULT_STYLES, inputBoxStyles, shapeStyles, dynamicStyles].map((style) => Config.Css.css(style)).join(" ");
  },
  input: ({ width = "11.5ch" } = {}) => Config.Css.css({ border: 0, outline: 0, width }),
};
//@@viewOff:css

//@@viewOn:helpers
function getFormattedFormat(format = NativeDateInput.defaultProps.format, lang) {
  const dn = new Intl.DisplayNames(lang, { type: "dateTimeField" });
  let formattedFormat = format;
  for (let key of ["year", "month", "day"]) {
    formattedFormat = formattedFormat.replace(new RegExp(`[${key[0].toUpperCase()}]+`), (v) =>
      dn.of(key)[0].toUpperCase().repeat(v.length),
    );
  }

  return formattedFormat;
}
//@@viewOff:helpers

const DateRangeBoxInputs = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "DateRangeBoxInputs",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    value: PropTypes.array,
    onChange: PropTypes.func.isRequired,
    size: PropTypes.string,
    required: PropTypes.bool,
    format: PropTypes.string,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    value: undefined,
    size: "m",
    required: false,
    format: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { value, onChange, size, required, format, readOnly, ...otherProps } = props;
    const [language] = useLanguage();

    const rangeFromRef = useRef();
    const rangeToRef = useRef();
    const rangeFromValueInstRef = useRef();
    const rangeToValueInstRef = useRef();
    const rangeFromValue = value?.[0];
    const rangeToValue = value?.[1];

    const formattedFromValue = useDateTimeFormat(value?.[0]);
    const formattedToValue = useDateTimeFormat(value?.[1]);
    const placeholder = getFormattedFormat(format, language);
    const inputProps = { required, placeholder, format, readOnly };

    const { width: rangeFromInputWidth, measureJsx: measureFromJsx } = useMeasureRangeInputWidths(
      rangeFromRef,
      placeholder,
      formattedFromValue,
    );

    const { width: rangeToInputWidth, measureJsx: measureToJsx } = useMeasureRangeInputWidths(
      rangeToRef,
      placeholder,
      formattedToValue,
    );

    useEffect(() => {
      if (rangeFromRef.current) {
        // autofocus with forcing input selection on the beginning
        rangeFromRef.current.setSelectionRange(0, 0);
        rangeFromRef.current.focus();
      }
    }, []);

    const { isMobileOrTablet } = useDevice();
    const containerSize = (isMobileOrTablet && CONTAINER_SIZE_MAP_MOBILE[size]) || size;
    const textType = (isMobileOrTablet && TEXT_TYPE_MAP_MOBILE[size]) || TEXT_TYPE_MAP[size];

    const background = useBackground();
    const [shapeStyles] = Uu5Elements.Input._getShapeStyles({ ...otherProps, background });

    function handleChange(type) {
      return (e) => {
        const newValue = value ? [...value] : [];
        const index = type === "to" ? 1 : 0;
        newValue[index] = e.data.value;

        onChange(new Utils.Event({ value: newValue }, e));
      };
    }

    function handleRangeFromKeyDown(e) {
      const valueInst = rangeFromValueInstRef.current.valueInst;
      if (valueInst) {
        const slotList = valueInst._slotList;
        const lastSlot = slotList[slotList.length - 1];
        const activeSlot = valueInst._activeSlot;

        if (e.defaultPrevented) return;

        if (e.key === "ArrowRight" && activeSlot.format === lastSlot.format) {
          setTimeout(() => rangeToRef.current.focus(), 0);
        }
      }
    }

    function handleRangeToKeyDown(e) {
      const valueInst = rangeToValueInstRef.current.valueInst;
      if (valueInst) {
        const slotList = valueInst._slotList;
        const firstSlot = slotList[0];
        const activeSlot = valueInst._activeSlot;

        if (e.defaultPrevented) return;

        if (e.key === "ArrowLeft" && activeSlot.format === firstSlot.format) {
          rangeFromRef.current.focus();
          if (rangeFromValue) {
            const rangeFromValueInst = rangeFromValueInstRef.current.valueInst;
            const slotList = rangeFromValueInst._slotList;
            rangeFromValueInst.setActiveSlot(slotList.length - 1);
          }
        }
      }
    }
    //@@viewOff:private

    //@@viewOn:render
    const attrs = Utils.VisualComponent.getAttrs(
      otherProps,
      Css.main({ ...otherProps, background, shapeStyles, containerSize, textType }),
    );

    return (
      <div {...attrs} tabIndex={-1}>
        <NativeDateInput
          {...inputProps}
          name="rangeFrom"
          value={rangeFromValue}
          onChange={handleChange("from")}
          className={Css.input({ width: rangeFromInputWidth })}
          ref={rangeFromRef}
          onKeyDown={handleRangeFromKeyDown}
          _valueInstRef={rangeFromValueInstRef}
        />
        {" - "}
        <NativeDateInput
          {...inputProps}
          name="rangeTo"
          value={rangeToValue}
          onChange={handleChange("to")}
          className={Css.input({ width: rangeToInputWidth })}
          ref={rangeToRef}
          onKeyDown={handleRangeToKeyDown}
          tabIndex={-1}
          _valueInstRef={rangeToValueInstRef}
        />
        {measureFromJsx}
        {measureToJsx}
      </div>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { DateRangeBoxInputs };
export default DateRangeBoxInputs;
//@@viewOff:exports
