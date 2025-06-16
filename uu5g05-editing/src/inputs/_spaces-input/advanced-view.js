//@@viewOn:imports
import { createVisualComponent, PropTypes, Utils, Lsi, useLsi } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Uu5Forms from "uu5g05-forms";
import AdvancedPanel from "./advanced-panel.js";
import {
  DEFAULT_VALUE,
  SCREEN_SIZE_LIST,
  SPACES_INPUT_DEFAULT_PROPS,
  SPACES_INPUT_PROP_TYPES,
  testScreenSizeObject,
} from "./tools.js";
import Config from "../../config/config.js";
import importLsi from "../../lsi/import-lsi.js";
//@@viewOff:imports

//@@viewOn:constants
//@@viewOff:constants

//@@viewOn:css
const Css = {
  main: () =>
    Config.Css.css({
      display: "flex",
      flexDirection: "column",
      gap: Uu5Elements.UuGds.SpacingPalette.getValue(["fixed", "e"]),
      marginTop: Uu5Elements.UuGds.SpacingPalette.getValue(["fixed", "e"]),
    }),
};
//@@viewOff:css

//@@viewOn:helpers
function getValue(value, screenSize) {
  let result = { margin: undefined, padding: undefined };

  if (value.margin && testScreenSizeObject(value.margin)) {
    // value is object with screen sizes
    result = { ...result, margin: value.margin[screenSize] };
  } else if (value.margin && !testScreenSizeObject(value.margin)) {
    // value is object with positions
    result = { ...result, margin: screenSize === "xs" ? value.margin : undefined };
  }

  if (value.padding && testScreenSizeObject(value.padding)) {
    // value is object with screen sizes
    result = { ...result, padding: value.padding[screenSize] };
  } else if (value.padding && !testScreenSizeObject(value.padding)) {
    // value is object with positions
    result = { ...result, padding: screenSize === "xs" ? value.padding : undefined };
  }
  return result;
}

function mergeValues(valueList) {
  let result = { margin: {}, padding: {} };
  for (let value of valueList) {
    if (value.margin) {
      for (let position in value.margin) {
        if (value.margin[position]) result.margin[position] = value.margin[position];
      }
    }
    if (value.padding) {
      for (let position in value.padding) {
        if (value.padding[position]) result.padding[position] = value.padding[position];
      }
    }
  }
  return result;
}

function getPlaceholder(propsValue, screenSize) {
  let result = {};

  switch (screenSize) {
    case "xs": {
      // xs inputs don't need a placeholder
      // but it is because of the expanded settings in AdvancedPanelView and margin/padding settings in ComponentView
      let valueXS = getValue(propsValue, "xs");
      result = mergeValues([valueXS]);
      break;
    }
    case "s": {
      let valueXS = getValue(propsValue, "xs");
      let valueS = getValue(propsValue, "s");
      result = mergeValues([valueXS, valueS]);
      break;
    }
    case "m": {
      let valueXS = getValue(propsValue, "xs");
      let valueS = getValue(propsValue, "s");
      let valueM = getValue(propsValue, "m");
      result = mergeValues([valueXS, valueS, valueM]);
      break;
    }
    case "l": {
      let valueXS = getValue(propsValue, "xs");
      let valueS = getValue(propsValue, "s");
      let valueM = getValue(propsValue, "m");
      let valueL = getValue(propsValue, "l");
      result = mergeValues([valueXS, valueS, valueM, valueL]);
      break;
    }
    case "xl": {
      let valueXS = getValue(propsValue, "xs");
      let valueS = getValue(propsValue, "s");
      let valueM = getValue(propsValue, "m");
      let valueL = getValue(propsValue, "l");
      let valueXL = getValue(propsValue, "xl");
      result = mergeValues([valueXS, valueS, valueM, valueL, valueXL]);
      break;
    }
  }
  return result;
}

function getFormattedValue(currentValue, origValue, screenSize) {
  let newValue;
  if (!Utils.Object.deepEqual(DEFAULT_VALUE, currentValue)) {
    newValue = { ...currentValue };
  }

  let result;
  if (origValue && testScreenSizeObject(origValue)) {
    // props.value was object with screen sizes
    result = { ...origValue, [screenSize]: newValue };
  } else if (origValue && !testScreenSizeObject(origValue)) {
    // props.value was object with positions
    result = { xs: origValue, [screenSize]: newValue };
  } else {
    // origValue is undefined
    result = { [screenSize]: newValue };
  }

  return result;
}

function getInitialOpen(screenSize, value) {
  let result = screenSize === "xs";

  if (screenSize !== "xs" && (value.margin || value.padding)) result = true;
  return result;
}
//@@viewOff:helpers

const AdvancedView = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "AdvancedView",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...SPACES_INPUT_PROP_TYPES,
    displayLegends: PropTypes.bool,
    errorList: PropTypes.array,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    ...SPACES_INPUT_DEFAULT_PROPS,
    displayLegends: false,
    errorList: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { onChange, value: propsValue, errorList, autoFocus, ...otherProps } = props;
    const spacingLsi = useLsi({ import: importLsi, path: ["FormSpaces"] });

    function handleChange(e, screenSize) {
      if (typeof onChange === "function") {
        let newMargin = getFormattedValue(e.data.value.margin, propsValue.margin, screenSize);
        let newPadding = getFormattedValue(e.data.value.padding, propsValue.padding, screenSize);

        onChange(new Utils.Event({ value: { margin: newMargin, padding: newPadding } }, e));
      }
    }
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const [elementAttrs, componentProps] = Utils.VisualComponent.splitProps(otherProps, Css.main());

    return (
      <div {...elementAttrs}>
        {(props.displayHorizontalMargin || props.displayVerticalMargin) && (
          <Uu5Elements.Text
            category="interface"
            segment="content"
            type="medium"
            colorScheme="building"
            significance="subdued"
          >
            <Lsi
              lsi={spacingLsi.infoForMargin}
              params={{
                horizontal: spacingLsi.infoForHorizontalMargin,
                vertical: spacingLsi.infoForVerticalMargin,
              }}
            />
          </Uu5Elements.Text>
        )}
        {SCREEN_SIZE_LIST.map((screenSize, i) => (
          <AdvancedPanel
            {...componentProps}
            autoFocus={i === 0 ? autoFocus : false}
            key={`advanced-panel_${i}_${screenSize}`}
            screenSize={screenSize}
            open={getInitialOpen(screenSize, getValue(propsValue, screenSize))}
            value={getValue(propsValue, screenSize)}
            placeholder={getPlaceholder(propsValue, screenSize)}
            onChange={(e) => handleChange(e, screenSize)}
            errorList={errorList?.filter((error) => error.screenSize === screenSize)}
          />
        ))}
      </div>
    );
    //@@viewOff:render
  },
});

const AdvancedViewWithValidation = Uu5Forms.withValidationMap(Uu5Forms.withValidationInput(AdvancedView));

//@@viewOn:exports
export { AdvancedViewWithValidation };
export default AdvancedViewWithValidation;
//@@viewOff:exports
