//@@viewOn:imports
import { createVisualComponent, Lsi, PropTypes, useEffect, useLsi, useRef, useState, Utils } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Uu5Forms from "uu5g05-forms";
import SpacesInputComponentView from "./component-view.js";
import { SCREEN_SIZE_LIST, SPACES_INPUT_DEFAULT_PROPS, SPACES_INPUT_PROP_TYPES, testSameValues } from "./tools.js";
import AdvancedInput from "./advanced-input.js";
import Config from "../../config/config.js";
import importLsi from "../../lsi/import-lsi.js";
//@@viewOff:imports

//@@viewOn:constants
const TEMPLATE_AREAS = {
  xs: `view, inputs`,
  m: `inputs inputs inputs inputs view view view`,
};
const TEMPLATE_COLUMNS = { xs: "100%", m: "repeat(7, 1fr)" };
const ICON_TOP = "uugdsstencil-layout-side-top";
const ICON_BOTTOM = "uugdsstencil-layout-side-bottom";
const ICON_LEFT = "uugdsstencil-layout-side-left";
const ICON_RIGHT = "uugdsstencil-layout-side-right";
const ICON_VERTICAL = "uugdsstencil-layout-side-left-right";
const ICON_HORIZONTAL = "uugdsstencil-layout-side-top-bottom";
//@@viewOff:constants

//@@viewOn:css
const Css = {
  grid: () => Config.Css.css({ margin: Uu5Elements.UuGds.SpacingPalette.getValue(["fixed", "e"]) }),
  label: () => {
    const { h: height } = Uu5Elements.UuGds.SizingPalette.getValue(["spot", "basic", "m"]) || {};
    return Config.Css.css({
      display: "inline-flex",
      marginBottom: Uu5Elements.UuGds.getValue(["SpacingPalette", "relative", "c"]) * height,
    });
  },
  wrapperInputs: (params) =>
    Config.Css.css({
      display: "flex",
      gap: Uu5Elements.UuGds.SpacingPalette.getValue(["fixed", "d"]),
      marginBottom: params?.isPadding && Uu5Elements.UuGds.SpacingPalette.getValue(["fixed", "e"]),
    }),
  inputs: () =>
    Config.Css.css({
      display: "flex",
      flexDirection: "column",
      width: "100%",
      gap: Uu5Elements.UuGds.SpacingPalette.getValue(["fixed", "d"]),
    }),
};
//@@viewOff:css

//@@viewOn:helpers
const getHelperSpacing = (screenSize) => `_helperForDelete_${screenSize}`;

function normalizeValue(value) {
  return {
    top: value?.top,
    right: value?.right,
    bottom: value?.bottom,
    left: value?.left,
  };
}

function getNewValue(newValue, origValue, position) {
  let result = {};

  if (position === "vertical") {
    result = { ...origValue, left: newValue, right: newValue };
  } else if (position === "horizontal") {
    result = { ...origValue, top: newValue, bottom: newValue };
  } else {
    result = { ...origValue, [position]: newValue };
  }
  return result;
}
//@@viewOff:helpers

const AdvancedPanelView = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "AdvancedPanelView",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...SPACES_INPUT_PROP_TYPES,
    placeholder: PropTypes.space,
    isPanelOpen: PropTypes.bool,
    screenSize: PropTypes.oneOf(SCREEN_SIZE_LIST),
    errorList: PropTypes.array,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    ...SPACES_INPUT_DEFAULT_PROPS,
    placeholder: undefined,
    isPanelOpen: undefined,
    screenSize: "xs",
    errorList: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const {
      value,
      placeholder,
      onChange,
      displayVerticalMargin,
      displayHorizontalMargin,
      displayVerticalPadding,
      displayHorizontalPadding,
      displayLegends,
      isPanelOpen,
      screenSize,
      errorList,
      onBlur,
      autoFocus,
      ...otherProps
    } = props;

    const margin = normalizeValue(value.margin);
    const padding = normalizeValue(value.padding);
    const marginPlaceholder = normalizeValue(placeholder.margin);
    const paddingPlaceholder = normalizeValue(placeholder.padding);

    const [marginExpanded, setMarginExpanded] = useState(!testSameValues(marginPlaceholder));
    const [paddingExpanded, setPaddingExpanded] = useState(!testSameValues(paddingPlaceholder));

    const { setItemValue, itemMap } = Uu5Forms.useFormApi();
    const lsi = useLsi({ import: importLsi, path: ["FormSpaces"] });
    const currentValuesRef = useRef({});

    useEffect(() => {
      currentValuesRef.current = {
        onChange,
        itemMap,
        setItemValue,
        margin,
        padding,
        screenSize,
        marginExpanded,
        paddingExpanded,
        marginPlaceholder,
        paddingPlaceholder,
      };
    });

    useEffect(() => {
      const { marginExpanded, paddingExpanded, marginPlaceholder, paddingPlaceholder } = currentValuesRef.current;

      let areDiffMarginValues = !testSameValues(marginPlaceholder);
      if (marginExpanded !== areDiffMarginValues) setMarginExpanded(areDiffMarginValues);

      let areDiffPaddingValues = !testSameValues(paddingPlaceholder);
      if (paddingExpanded !== areDiffPaddingValues) setPaddingExpanded(areDiffPaddingValues);
    }, [isPanelOpen]);

    useEffect(() => {
      const { onChange, itemMap, setItemValue, margin, padding, screenSize } = currentValuesRef.current;
      if (isPanelOpen && screenSize !== "xs") {
        if (typeof onChange === "function") {
          // panel was closed and is now open -> add the margin/padding for this screenSize from helper prop
          if (itemMap[getHelperSpacing(screenSize)]) {
            let savedValue = itemMap[getHelperSpacing(screenSize)].value;
            onChange(new Utils.Event({ value: { margin: savedValue.margin, padding: savedValue.padding } }));
          }
        }
      } else if (isPanelOpen === false) {
        // panel is closed -> remove the margin/padding for this screenSize from props.value
        if (typeof onChange === "function") {
          setItemValue(getHelperSpacing(screenSize), { margin, padding }); // save the original margin and padding to helper prop
          onChange(new Utils.Event({ value: { margin: undefined, padding: undefined } })); // remove value in this screen size when the panel is closed
        }
      }
    }, [isPanelOpen]);

    function handleChange(e, spaceType, position) {
      if (typeof onChange === "function") {
        if (spaceType === "margin") {
          let newValue = getNewValue(e.data.value, margin, position);
          onChange(new Utils.Event({ value: { margin: newValue, padding } }, e));
        } else {
          let newValue = getNewValue(e.data.value, padding, position);
          onChange(new Utils.Event({ value: { padding: newValue, margin } }, e));
        }
      }
    }
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const [elementProps, componentProps] = Utils.VisualComponent.splitProps(otherProps, Css.grid());

    return (
      <Uu5Elements.Grid
        {...elementProps}
        templateAreas={TEMPLATE_AREAS}
        templateColumns={TEMPLATE_COLUMNS}
        columnGap={Uu5Elements.UuGds.SpacingPalette.getValue(["fixed", "g"])}
      >
        <Uu5Elements.Grid.Item gridArea="inputs">
          {(displayVerticalMargin || displayHorizontalMargin) && (
            <Uu5Forms.Label className={Css.label()}>Margin</Uu5Forms.Label>
          )}
          {(displayVerticalMargin || displayHorizontalMargin) && (
            <div
              className={Css.wrapperInputs({
                isPadding: (displayVerticalPadding || displayHorizontalPadding) && marginExpanded,
              })}
            >
              {/* MARGIN horizontal - top, bottom */}
              {displayHorizontalMargin && (
                <div className={Css.inputs()}>
                  <AdvancedInput
                    {...componentProps}
                    autoFocus={autoFocus}
                    iconLeft={marginExpanded ? ICON_TOP : ICON_HORIZONTAL}
                    value={margin.top}
                    placeholder={marginPlaceholder.top}
                    onChange={(e) => handleChange(e, "margin", marginExpanded ? "top" : "horizontal")}
                    onBlur={onBlur}
                    tooltip={
                      <Lsi import={importLsi} path={["FormSpaces", marginExpanded ? "outerTop" : "outerVertical"]} />
                    }
                    errorProps={
                      errorList?.find((error) => error.spaceType === "margin" && error.position === "top")?.props
                    }
                  />
                  <Uu5Elements.CollapsibleBox collapsed={!marginExpanded}>
                    <AdvancedInput
                      {...componentProps}
                      iconLeft={ICON_BOTTOM}
                      value={margin.bottom}
                      placeholder={marginPlaceholder.bottom}
                      onChange={(e) => handleChange(e, "margin", "bottom")}
                      onBlur={onBlur}
                      tooltip={<Lsi import={importLsi} path={["FormSpaces", "outerBottom"]} />}
                      errorProps={
                        errorList?.find((error) => error.spaceType === "margin" && error.position === "bottom")?.props
                      }
                    />
                  </Uu5Elements.CollapsibleBox>
                </div>
              )}
              {/* MARGIN vertical - left, right */}
              {displayVerticalMargin && (
                <div className={Css.inputs()}>
                  <AdvancedInput
                    {...componentProps}
                    iconLeft={marginExpanded ? ICON_LEFT : ICON_VERTICAL}
                    value={margin.left}
                    placeholder={marginPlaceholder.left}
                    onChange={(e) => handleChange(e, "margin", marginExpanded ? "left" : "vertical")}
                    onBlur={onBlur}
                    tooltip={
                      <Lsi import={importLsi} path={["FormSpaces", marginExpanded ? "outerLeft" : "outerHorizontal"]} />
                    }
                    errorProps={
                      errorList?.find((error) => error.spaceType === "margin" && error.position === "left")?.props
                    }
                  />
                  <Uu5Elements.CollapsibleBox collapsed={!marginExpanded}>
                    <AdvancedInput
                      {...componentProps}
                      iconLeft={ICON_RIGHT}
                      value={margin.right}
                      placeholder={marginPlaceholder.right}
                      onChange={(e) => handleChange(e, "margin", "right")}
                      onBlur={onBlur}
                      tooltip={<Lsi import={importLsi} path={["FormSpaces", "outerRight"]} />}
                      errorProps={
                        errorList?.find((error) => error.spaceType === "margin" && error.position === "right")?.props
                      }
                    />
                  </Uu5Elements.CollapsibleBox>
                </div>
              )}
              <Uu5Elements.Button
                icon="uugdsstencil-layout-side-all"
                onClick={() => setMarginExpanded((prevValue) => !prevValue)}
                significance={marginExpanded ? "common" : "subdued"}
                colorScheme={marginExpanded ? "primary" : "neutral"}
                tooltip={lsi.setSidesSeparately}
              />
            </div>
          )}
          {(displayVerticalPadding || displayHorizontalPadding) && (
            <Uu5Forms.Label className={Css.label()}>Padding</Uu5Forms.Label>
          )}
          {(displayVerticalPadding || displayHorizontalPadding) && (
            <div className={Css.wrapperInputs()}>
              {/* PADDING horizontal - top, bottom */}
              {displayHorizontalPadding && (
                <div className={Css.inputs()}>
                  <AdvancedInput
                    {...componentProps}
                    iconLeft={paddingExpanded ? ICON_TOP : ICON_HORIZONTAL}
                    value={padding.top}
                    placeholder={paddingPlaceholder.top}
                    onChange={(e) => handleChange(e, "padding", paddingExpanded ? "top" : "horizontal")}
                    onBlur={onBlur}
                    tooltip={
                      <Lsi import={importLsi} path={["FormSpaces", paddingExpanded ? "innerTop" : "innerHorizontal"]} />
                    }
                    errorProps={
                      errorList?.find((error) => error.spaceType === "padding" && error.position === "top")?.props
                    }
                  />
                  <Uu5Elements.CollapsibleBox collapsed={!paddingExpanded}>
                    <AdvancedInput
                      {...componentProps}
                      iconLeft={ICON_BOTTOM}
                      value={padding.bottom}
                      placeholder={paddingPlaceholder.bottom}
                      onChange={(e) => handleChange(e, "padding", "bottom")}
                      onBlur={onBlur}
                      tooltip={<Lsi import={importLsi} path={["FormSpaces", "innerBottom"]} />}
                      errorProps={
                        errorList?.find((error) => error.spaceType === "padding" && error.position === "bottom")?.props
                      }
                    />
                  </Uu5Elements.CollapsibleBox>
                </div>
              )}
              {/* PADDING vertical - right, left */}
              {displayVerticalPadding && (
                <div className={Css.inputs()}>
                  <AdvancedInput
                    {...componentProps}
                    iconLeft={paddingExpanded ? ICON_LEFT : ICON_VERTICAL}
                    value={padding.left}
                    placeholder={paddingPlaceholder.left}
                    onChange={(e) => handleChange(e, "padding", paddingExpanded ? "left" : "vertical")}
                    onBlur={onBlur}
                    tooltip={
                      <Lsi import={importLsi} path={["FormSpaces", paddingExpanded ? "innerLeft" : "innerVertical"]} />
                    }
                    errorProps={
                      errorList?.find((error) => error.spaceType === "padding" && error.position === "left")?.props
                    }
                  />
                  <Uu5Elements.CollapsibleBox collapsed={!paddingExpanded}>
                    <AdvancedInput
                      {...componentProps}
                      iconLeft={ICON_RIGHT}
                      value={padding.right}
                      placeholder={paddingPlaceholder.right}
                      onChange={(e) => handleChange(e, "padding", "right")}
                      onBlur={onBlur}
                      tooltip={<Lsi import={importLsi} path={["FormSpaces", "innerRight"]} />}
                      errorProps={
                        errorList?.find((error) => error.spaceType === "padding" && error.position === "right")?.props
                      }
                    />
                  </Uu5Elements.CollapsibleBox>
                </div>
              )}
              <Uu5Elements.Button
                icon="uugdsstencil-layout-side-all"
                onClick={() => setPaddingExpanded((prevValue) => !prevValue)}
                significance={paddingExpanded ? "common" : "subdued"}
                colorScheme={paddingExpanded ? "primary" : "neutral"}
                tooltip={lsi.setSidesSeparately}
              />
            </div>
          )}
        </Uu5Elements.Grid.Item>
        <Uu5Elements.Grid.Item gridArea="view">
          <SpacesInputComponentView
            height={124}
            displayLegends={displayLegends}
            margin={marginPlaceholder}
            padding={paddingPlaceholder}
          />
        </Uu5Elements.Grid.Item>
      </Uu5Elements.Grid>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { AdvancedPanelView };
export default AdvancedPanelView;
//@@viewOff:exports
