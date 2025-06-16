import {
  createComponent,
  createVisualComponent,
  PropTypes,
  Utils,
  useRef,
  useState,
  useElementSize,
  useLsi,
} from "uu5g05";
import Uu5Elements, { UuGds } from "uu5g05-elements";
import Config from "../config/config.js";
import NumberInput from "../inputs/number-input";
import importLsi from "../lsi/import-lsi.js";
import withExtensionInput from "../with-extension-input.js";
import { roundToStepDecimalCount } from "./tools.js";

const INPUT_WIDTH = 48;
const AREAS_WIDTH_MAP = {
  slider: "1fr",
  left: INPUT_WIDTH + "px",
  right: INPUT_WIDTH + "px",
  type: "auto",
};

function getValueData(value) {
  let intervalType = "closed";
  let isNotNull = false;
  let sliderValue = value.map(({ value: v }) => {
    isNotNull ||= v != null;
    return v;
  });
  if (!isNotNull) sliderValue = undefined;

  if (value.length === 1) {
    if (value[0].open) intervalType = "open";
  } else {
    if (value[0].open && value[1].open) intervalType = "open";
    else if (value[0].open && !value[1].open) intervalType = "left-open";
    else if (!value[0].open && value[1].open) intervalType = "right-open";
  }
  return {
    intervalType,
    sliderValue,
    thumbSignificanceList: value.map(({ open }) => (open ? "common" : "highlighted")),
  };
}

function validateNumberInputValue(value, min, max, step) {
  let newV = value;
  if (step) newV = roundToStepDecimalCount(Math.round((value - min) / step) * step + min, step);
  return Math.max(min, Math.min(newV, max));
}

function sortValues(a, b) {
  return (a && typeof a === "object" ? a.value : a) - (b && typeof b === "object" ? b.value : b);
}

const ExtendedNumberInput = withExtensionInput(NumberInput);

const SliderInputWithNumbers = createVisualComponent({
  render(props) {
    const {
      Component,
      displayNumberInputs,
      displayIntervalTypeSwitch,
      onChange,
      width,
      numberInputProps,
      ...restProps
    } = props;
    const { min, max, step, value } = restProps;

    const lsi = useLsi(importLsi, ["Slider"]);

    const validationRef = useRef();
    const [numberInputValues, setNumberInputValues] = useState({});

    let { intervalType, sliderValue, thumbSignificanceList } = getValueData(value);

    const minInputNum = "0" in numberInputValues ? numberInputValues[0] : (value[0].value ?? min);
    const maxInputNum =
      value.length - 1 in numberInputValues
        ? numberInputValues[value.length - 1]
        : (value[value.length - 1].value ?? (value.length > 1 ? max : min));

    function handleNumberInputChange(e, valueIndex) {
      if (e.data.value != null) {
        const newV = validateNumberInputValue(e.data.value, min, max, step);
        // if values are the same, then the onChange is called, in other case the value is changed only in ref and onChange is called on blur
        if (newV === e.data.value) {
          const newValue = [...value];
          newValue[valueIndex] = { value: newV, open: newV == null || value?.[valueIndex]?.open };
          newValue.sort(sortValues);
          onChange?.(new Utils.Event({ value: newValue }, e));
        }
      }
      setNumberInputValues((cur) => ({ ...cur, [valueIndex]: e.data.value })); // remember exact numeric value (such as `null` if user started typing negative number, i.e. "-")
    }

    function handleNumberInputBlur(e, valueIndex) {
      const v = numberInputValues[valueIndex];
      const newV = validateNumberInputValue(v, min, max, step);
      // if value is valid, then the onChange was called by handleNumberInputChange
      if (newV !== v) {
        const newValue = [...value];
        newValue[valueIndex] = { value: newV, open: newV == null || value?.[valueIndex]?.open };
        newValue.sort(sortValues);
        onChange?.(new Utils.Event({ value: newValue }, e));
      }

      setNumberInputValues(({ [valueIndex]: _, ...rest }) => rest);
      validationRef.current?.(); // revalidate Slider
    }

    function handleIntervalType(type) {
      return (e) => {
        const newValue = value.map((it) => ({ ...it }));
        switch (type) {
          case "open":
            newValue[1].open = newValue[0].open = true;
            break;
          case "left-open":
            newValue[0].open = true;
            newValue[1].open = false;
            break;
          case "right-open":
            newValue[0].open = false;
            newValue[1].open = true;
            break;
          case "closed":
            if (newValue[0].value != null) newValue[0].open = false;
            if (newValue[1].value != null) newValue[1].open = false;
            break;
        }

        onChange?.(new Utils.Event({ value: newValue }, e));
      };
    }

    const handleChange =
      typeof onChange === "function"
        ? (e) => {
            e.data.value = e.data.value.map((v, i) => ({ ...value[i], value: v }));
            onChange(e);
          }
        : undefined;

    const { ref, width: elementWidth } = useElementSize();
    const isVertical = elementWidth <= 300;

    const leftNumInputProps = numberInputProps?.[0] ?? numberInputProps;
    const rightNumInputProps = numberInputProps?.[1] ?? numberInputProps?.[0] ?? numberInputProps;

    let templateColumns,
      templateAreas = "slider",
      isHalfInterval;

    let colSpan,
      inputsDown,
      widthToPass = width;
    if (displayNumberInputs) {
      widthToPass ||= 312;

      if (value[0]?.value == null) {
        templateAreas = "slider right";
        isHalfInterval = true;
      } else if (value[1]?.value == null) {
        templateAreas = "left slider";
        isHalfInterval = true;
      } else {
        if (isVertical) {
          inputsDown = true;
          templateAreas = "slider slider, left right";
          templateColumns = "1fr 1fr";

          if (displayIntervalTypeSwitch) {
            colSpan = 2;
            templateAreas = "slider slider slider type, left left right right";
            const btnSize = UuGds.SizingPalette.getValue(["spot", "basic", restProps.size]).h;
            templateColumns = `${btnSize}px 1fr 1fr ${btnSize}px`;
          }
        } else {
          templateAreas = "left slider right";
        }
      }
    }
    widthToPass ||= 244; // for displayIntervalTypeSwitch

    if (!templateAreas.includes(",")) {
      if (displayIntervalTypeSwitch) templateAreas += " type";
      templateColumns ??= templateAreas.replace(/\w+/g, (v) => {
        if (v === "left" && leftNumInputProps?.width)
          return leftNumInputProps.width + (typeof leftNumInputProps.width === "number" ? "px" : "");
        if (v === "right" && rightNumInputProps?.width)
          return rightNumInputProps.width + (typeof rightNumInputProps.width === "number" ? "px" : "");
        return AREAS_WIDTH_MAP[v];
      });
    }

    const { elementProps, componentProps } = Utils.VisualComponent.splitProps(
      restProps,
      Config.Css.css({
        width: widthToPass,
        maxWidth: "100%",
      }),
    );

    return (
      <Uu5Elements.Grid
        {...elementProps}
        display={widthToPass && widthToPass !== "100%" ? "inline" : undefined}
        templateColumns={templateColumns}
        templateAreas={templateAreas}
        rowGap={UuGds.SpacingPalette.getValue(["fixed", "b"])}
        columnGap={UuGds.SpacingPalette.getValue(["fixed", "c"])}
        elementRef={Utils.Component.combineRefs(elementProps.elementRef, ref)}
      >
        <Uu5Elements.Grid.Item gridArea="slider">
          {({ style }) => (
            <Component
              {...componentProps}
              width="100%"
              onChange={handleChange}
              value={sliderValue}
              thumbSignificanceList={thumbSignificanceList}
              className={Config.Css.css(style)}
              validationRef={Utils.Component.combineRefs(componentProps.validationRef, validationRef)}
            />
          )}
        </Uu5Elements.Grid.Item>
        {displayNumberInputs && (
          <>
            {value.length > 1 && value[0].value != null && (
              <Uu5Elements.Grid.Item gridArea="left" justifySelf="start" colSpan={colSpan}>
                {({ style }) => (
                  <ExtendedNumberInput
                    {...leftNumInputProps}
                    className={Config.Css.css(style)}
                    value={minInputNum}
                    min={min}
                    max={maxInputNum}
                    step={step}
                    onChange={(e) => handleNumberInputChange(e, 0)}
                    onBlur={(e) => handleNumberInputBlur(e, 0)}
                    width={inputsDown ? "50%" : "100%"}
                    size={componentProps.size}
                  />
                )}
              </Uu5Elements.Grid.Item>
            )}
            {value[1]?.value != null && (
              <Uu5Elements.Grid.Item gridArea="right" justifySelf="end" colSpan={colSpan}>
                {({ style }) => (
                  <ExtendedNumberInput
                    {...rightNumInputProps}
                    className={Config.Css.css(style)}
                    value={maxInputNum}
                    min={minInputNum}
                    max={max}
                    step={step}
                    onChange={(e) => handleNumberInputChange(e, value.length - 1)}
                    onBlur={(e) => handleNumberInputBlur(e, value.length - 1)}
                    width={inputsDown ? "50%" : "100%"}
                    size={componentProps.size}
                  />
                )}
              </Uu5Elements.Grid.Item>
            )}
          </>
        )}
        {displayIntervalTypeSwitch && value.length === 2 && (
          <Uu5Elements.Grid.Item gridArea="type">
            {({ style }) => (
              <Uu5Elements.Dropdown
                tooltip={lsi.interval}
                className={Config.Css.css(style)}
                icon="uugds-tune-horizontal"
                itemList={(isHalfInterval ? ["closed", "open"] : ["closed", "open", "left-open", "right-open"]).map(
                  (v) => ({
                    children: lsi.intervalType[v],
                    onClick: handleIntervalType(v),
                    ...((isHalfInterval && intervalType.includes("-") ? "closed" : intervalType) === v
                      ? { colorScheme: "primary", significance: "distinct" }
                      : null),
                  }),
                )}
                openPosition="bottom-left"
                iconOpen={null}
                iconClosed={null}
                size={componentProps.size}
              />
            )}
          </Uu5Elements.Grid.Item>
        )}
      </Uu5Elements.Grid>
    );
  },
});

function normalizeValue(value, onChange) {
  let newValue = value,
    newOnChange;
  if (Array.isArray(value)) {
    let tempArr = [];
    [0, 1].forEach((i) => {
      if (value[i] !== undefined) {
        if (value[i] == null || typeof value[i] !== "object") tempArr[i] = { value: value[i], open: value[i] == null };
        else if (value[i].open == null || (value[i].value == null && value[i].open !== true))
          tempArr[i] = {
            ...value[i],
            open: value[i].value == null,
          };
      }
    });

    if (tempArr[1] || value[1]) newValue = [tempArr[0] || value[0], tempArr[1] || value[1]];
    else if (tempArr[0]) newValue = [tempArr[0]];

    newOnChange = (e) => {
      e.data.value = e.data.value.map((v, i) => {
        let newV = v;
        if ((value[i] === null && v.value == null) || (typeof value[i] !== "object" && !v.open)) {
          newV = v.value;
        }
        return newV;
      });
      onChange?.(e);
    };
  } else {
    newValue = [{ value, open: value == null }];

    newOnChange = (e) => {
      e.data.value = e.data.value[0].value;
      onChange?.(e);
    };
  }

  return { value: newValue, onChange: newOnChange };
}

function simplifyValue(value, onChange) {
  let thumbSignificanceList,
    newValue = value,
    newOnChange = onChange;

  if (Array.isArray(value)) {
    thumbSignificanceList = [];
    let isObject = false;

    newValue = value.map((v) => {
      let newV = v;
      if (v && typeof v === "object") {
        isObject = true;
        newV = v.value;
        thumbSignificanceList.push(v.open ? "common" : "highlighted");
      } else {
        thumbSignificanceList.push("highlighted");
      }
      return newV;
    });

    if (isObject) {
      newOnChange = (e) => {
        e.data.value = e.data.value.map((v, i) => {
          let newV = v;
          if (value[i] && typeof value[i] === "object") {
            newV = { ...value[i], value: v };
          }
          return newV;
        });
        onChange?.(e);
      };
    }
  }

  return { value: newValue, thumbSignificanceList, onChange: newOnChange };
}

function withNumberInputsSlider(Input) {
  const Comp = createComponent({
    //@@viewOn:statics
    uu5Tag: Config.TAG + `withNumberInputsSlider(${Input.uu5Tag || Input.displayName})`,
    //@@viewOff:statics

    //@@viewOn:propTypes
    propTypes: {
      ...Input.propTypes,
      displayNumberInputs: PropTypes.bool,
      displayIntervalTypeSwitch: PropTypes.bool,
      value: PropTypes.oneOfType([
        Input.propTypes.value,
        PropTypes.arrayOf(
          PropTypes.shape({
            value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
            open: PropTypes.bool,
          }),
        ),
      ]),
    },
    //@@viewOff:propTypes

    //@@viewOn:defaultProps
    defaultProps: {
      ...Input.defaultProps,
      width: undefined, // because width of input with number inputs is bigger then default for only slider
    },
    //@@viewOff:defaultProps

    render(props) {
      //@@viewOn:private
      const { displayNumberInputs, displayIntervalTypeSwitch, value, onChange, ...otherProps } = props;
      //@@viewOff:private

      //@@viewOn:render
      return displayNumberInputs || displayIntervalTypeSwitch ? (
        <SliderInputWithNumbers {...props} Component={Input} {...normalizeValue(value, onChange)} />
      ) : (
        <Input {...otherProps} {...simplifyValue(value, onChange)} />
      );
      //@@viewOff:render
    },
  });

  Utils.Component.mergeStatics(Comp, Input);

  return Comp;
}

export default withNumberInputsSlider;
