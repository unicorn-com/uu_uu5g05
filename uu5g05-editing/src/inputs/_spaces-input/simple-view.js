//@@viewOn:imports
import { createVisualComponent, Lsi, PropTypes, useLsi, useState, Utils } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Uu5Forms from "uu5g05-forms";
import SpacesInputComponentView from "./component-view.js";
import SimpleSlider from "./simple-slider.js";
import { SLIDER_ITEM_LIST, SPACES_INPUT_DEFAULT_PROPS, SPACES_INPUT_PROP_TYPES, testSameValues } from "./tools.js";
import Config from "../../config/config.js";
import importLsi from "../../lsi/import-lsi.js";
//@@viewOff:imports

//@@viewOn:constants
const TEMPLATE_AREAS = {
  xs: `info, view, sliders`,
  m: `info info info info info info info,
  sliders sliders sliders sliders view view view`,
};
const TEMPLATE_COLUMNS = { xs: "100%", m: "repeat(7, 1fr)" };
//@@viewOff:constants

//@@viewOn:css
const Css = {
  info: () =>
    Config.Css.css({
      display: "grid",
      gap: Uu5Elements.UuGds.SpacingPalette.getValue(["fixed", "e"]),
      marginTop: Uu5Elements.UuGds.SpacingPalette.getValue(["fixed", "e"]),
    }),
  legend: () => Config.Css.css({ display: "flex", gap: Uu5Elements.UuGds.SpacingPalette.getValue(["fixed", "e"]) }),
  spaceFixedE: () => Config.Css.css({ marginBottom: Uu5Elements.UuGds.SpacingPalette.getValue(["fixed", "e"]) }),
};
//@@viewOff:css

//@@viewOn:helpers
function normalizeValue(value) {
  let defaultValueSlider = SLIDER_ITEM_LIST[0].value;

  return {
    top: value?.top || defaultValueSlider,
    right: value?.right || defaultValueSlider,
    bottom: value?.bottom || defaultValueSlider,
    left: value?.left || defaultValueSlider,
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

function filterValue(value, displayVertical, displayHorizontal) {
  let result = {};

  if (displayVertical) {
    result.left = value.left;
    result.right = value.right;
  }
  if (displayHorizontal) {
    result.top = value.top;
    result.bottom = value.bottom;
  }
  return result;
}
//@@viewOff:helpers

const SimpleView = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "SimpleView",
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
    const {
      value,
      onChange,
      displayVerticalMargin,
      displayHorizontalMargin,
      displayVerticalPadding,
      displayHorizontalPadding,
      displayLegends,
      errorList,
      onBlur,
      autoFocus,
      ...otherProps
    } = props;
    const spacingLsi = useLsi({ import: importLsi, path: ["FormSpaces"] });

    const margin = normalizeValue(value.margin);
    const padding = normalizeValue(value.padding);
    const isValueHorizontalAndVertical = testSameValues(margin) && testSameValues(padding);
    const [expanded, setExpanded] = useState(!isValueHorizontalAndVertical);

    function handleChange(e, spaceType, position) {
      if (typeof onChange === "function") {
        if (spaceType === "margin") {
          let newValue = getNewValue(e.data.value, margin, position);
          let filteredValue = filterValue(newValue, displayVerticalMargin, displayHorizontalMargin);
          onChange(new Utils.Event({ value: { margin: filteredValue, padding } }, e));
        } else {
          let newValue = getNewValue(e.data.value, padding, position);
          let filteredValue = filterValue(newValue, displayVerticalPadding, displayHorizontalPadding);
          onChange(new Utils.Event({ value: { padding: filteredValue, margin } }, e));
        }
      }
    }
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const [elementProps, componentProps] = Utils.VisualComponent.splitProps(otherProps);
    const { ref, ...otherElementProps } = elementProps;

    return (
      <Uu5Elements.Grid
        {...otherElementProps}
        elementRef={ref}
        templateAreas={TEMPLATE_AREAS}
        templateColumns={TEMPLATE_COLUMNS}
        rowGap={Uu5Elements.UuGds.SpacingPalette.getValue(["fixed", "g"])}
        columnGap={Uu5Elements.UuGds.SpacingPalette.getValue(["fixed", "g"])}
      >
        <Uu5Elements.Grid.Item gridArea="info" className={Css.info()}>
          <Uu5Elements.Text
            category="interface"
            segment="content"
            type="medium"
            colorScheme="building"
            significance="subdued"
          >
            <Lsi import={importLsi} path={["FormSpaces", "info"]} />
          </Uu5Elements.Text>
          {(displayHorizontalMargin || displayVerticalMargin) && (
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
                  horizontal: spacingLsi.infoForHorizontalOuter,
                  vertical: spacingLsi.infoForVerticalOuter,
                }}
              />
            </Uu5Elements.Text>
          )}
        </Uu5Elements.Grid.Item>

        <Uu5Elements.Grid.Item gridArea="sliders">
          {/* MARGIN horizontal - top, bottom */}
          {displayHorizontalMargin && (
            <SimpleSlider
              {...componentProps}
              autoFocus={autoFocus}
              label={<Lsi import={importLsi} path={["FormSpaces", expanded ? "outerTop" : "outerVertical"]} />}
              className={
                expanded || displayVerticalMargin || displayVerticalPadding || displayHorizontalPadding
                  ? Css.spaceFixedE()
                  : undefined
              }
              value={margin.top}
              onChange={(e) => handleChange(e, "margin", expanded ? "top" : "horizontal")}
              onBlur={onBlur}
              errorProps={errorList?.find((error) => error.spaceType === "margin" && error.position === "top")?.props}
            />
          )}
          {displayHorizontalMargin && (
            <Uu5Elements.CollapsibleBox collapsed={!expanded}>
              <SimpleSlider
                {...componentProps}
                label={<Lsi import={importLsi} path={["FormSpaces", "outerBottom"]} />}
                className={
                  displayVerticalMargin || displayVerticalPadding || displayHorizontalPadding
                    ? Css.spaceFixedE()
                    : undefined
                }
                value={margin.bottom}
                onChange={(e) => handleChange(e, "margin", "bottom")}
                onBlur={onBlur}
                errorProps={
                  errorList?.find((error) => error.spaceType === "margin" && error.position === "bottom")?.props
                }
              />
            </Uu5Elements.CollapsibleBox>
          )}

          {/* MARGIN vertical - right, left */}
          {displayVerticalMargin && (
            <SimpleSlider
              {...componentProps}
              label={<Lsi import={importLsi} path={["FormSpaces", expanded ? "outerLeft" : "outerHorizontal"]} />}
              className={expanded || displayVerticalPadding || displayHorizontalPadding ? Css.spaceFixedE() : undefined}
              value={margin.left}
              onChange={(e) => handleChange(e, "margin", expanded ? "left" : "vertical")}
              onBlur={onBlur}
              errorProps={errorList?.find((error) => error.spaceType === "margin" && error.position === "left")?.props}
            />
          )}
          {displayVerticalMargin && (
            <Uu5Elements.CollapsibleBox collapsed={!expanded}>
              <SimpleSlider
                {...componentProps}
                label={<Lsi import={importLsi} path={["FormSpaces", "outerRight"]} />}
                className={displayVerticalPadding || displayHorizontalPadding ? Css.spaceFixedE() : undefined}
                value={margin.right}
                onChange={(e) => handleChange(e, "margin", "right")}
                onBlur={onBlur}
                errorProps={
                  errorList?.find((error) => error.spaceType === "margin" && error.position === "right")?.props
                }
              />
            </Uu5Elements.CollapsibleBox>
          )}

          {/* PADDING horizontal - top, bottom */}
          {displayHorizontalPadding && (
            <SimpleSlider
              {...componentProps}
              label={<Lsi import={importLsi} path={["FormSpaces", expanded ? "innerTop" : "innerHorizontal"]} />}
              className={expanded || displayVerticalPadding ? Css.spaceFixedE() : undefined}
              value={padding.top}
              onChange={(e) => handleChange(e, "padding", expanded ? "top" : "horizontal")}
              onBlur={onBlur}
              errorProps={errorList?.find((error) => error.spaceType === "padding" && error.position === "top")?.props}
            />
          )}
          {displayHorizontalPadding && (
            <Uu5Elements.CollapsibleBox collapsed={!expanded}>
              <SimpleSlider
                {...componentProps}
                label={<Lsi import={importLsi} path={["FormSpaces", "innerBottom"]} />}
                className={displayVerticalPadding ? Css.spaceFixedE() : undefined}
                value={padding.bottom}
                onChange={(e) => handleChange(e, "padding", "bottom")}
                onBlur={onBlur}
                errorProps={
                  errorList?.find((error) => error.spaceType === "padding" && error.position === "bottom")?.props
                }
              />
            </Uu5Elements.CollapsibleBox>
          )}

          {/* PADDING vertical - right, left */}
          {displayVerticalPadding && (
            <SimpleSlider
              {...componentProps}
              label={<Lsi import={importLsi} path={["FormSpaces", expanded ? "innerLeft" : "innerVertical"]} />}
              className={expanded ? Css.spaceFixedE() : undefined}
              value={padding.left}
              onChange={(e) => handleChange(e, "padding", expanded ? "left" : "vertical")}
              onBlur={onBlur}
              errorProps={errorList?.find((error) => error.spaceType === "padding" && error.position === "left")?.props}
            />
          )}
          {displayVerticalPadding && (
            <Uu5Elements.CollapsibleBox collapsed={!expanded}>
              <SimpleSlider
                {...componentProps}
                label={<Lsi import={importLsi} path={["FormSpaces", "innerRight"]} />}
                value={padding.right}
                onChange={(e) => handleChange(e, "padding", "right")}
                onBlur={onBlur}
                errorProps={
                  errorList?.find((error) => error.spaceType === "padding" && error.position === "right")?.props
                }
              />
            </Uu5Elements.CollapsibleBox>
          )}
        </Uu5Elements.Grid.Item>

        <Uu5Elements.Grid.Item gridArea="view">
          <SpacesInputComponentView height={160} displayLegends={displayLegends} margin={margin} padding={padding} />
          <Uu5Elements.Toggle
            value={expanded}
            onChange={(e) => setExpanded(e.data.value)}
            label={<Lsi import={importLsi} path={["FormSpaces", "setSidesSeparately"]} />}
          />
        </Uu5Elements.Grid.Item>
      </Uu5Elements.Grid>
    );
    //@@viewOff:render
  },
});

const SimpleViewWithValidation = Uu5Forms.withValidationMap(Uu5Forms.withValidationInput(SimpleView));

//@@viewOn:exports
export { SimpleViewWithValidation };
export default SimpleViewWithValidation;
//@@viewOff:exports
