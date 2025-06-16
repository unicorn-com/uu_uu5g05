//@@viewOn:imports
import { createVisualComponent, Lsi, useRef, useState, useWillMount, Utils } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Uu5Forms from "uu5g05-forms";
import { SPACES_INPUT_DEFAULT_PROPS, SPACES_INPUT_PROP_TYPES, SIMPLE_VIEW, ADVANCED_VIEW } from "./tools.js";
import { checkErrorList, getErrorList, getValue, getValueForOnChange, getView } from "./spaces-input-tools.js";
import SimpleView from "./simple-view.js";
import AdvancedView from "./advanced-view.js";
import Config from "../../config/config.js";
import importLsi from "../../lsi/import-lsi.js";
//@@viewOff:imports

//@@viewOn:constants
//@@viewOff:constants

//@@viewOn:css
const Css = {
  main: () => Config.Css.css({ width: "100%" }),
};
//@@viewOff:css

//@@viewOn:helpers
//@@viewOff:helpers

const _SpacesInput = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "SpacesInput",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...SPACES_INPUT_PROP_TYPES,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    ...SPACES_INPUT_DEFAULT_PROPS,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const {
      value: propsValue,
      onChange,
      displayVerticalMargin,
      displayHorizontalMargin,
      displayVerticalPadding,
      displayHorizontalPadding,
      onValidate,
      name,
      onBlur,
      ...otherProps
    } = props;

    // unit must defined due to remove future bugs with missing unit (e.g. padding="10 20" is not valid)
    const isNecessaryAddUnitRef = useRef(true);
    const formattedValue = getValue(
      propsValue,
      displayVerticalMargin,
      displayHorizontalMargin,
      displayVerticalPadding,
      displayHorizontalPadding,
      isNecessaryAddUnitRef.current,
    );

    if (process.env.NODE_ENV !== "production") {
      useWillMount(() => {
        Utils.LoggerFactory.get(Config.TAG + "FormSpaces").error(
          `WARNING: This component is deprecated. It is recommended to use components from Uu5Editing instead. (https://uuapp.plus4u.net/uu-bookkit-maing01/5ee03d6a2be14b9f8d6e138b3ed3d250)`,
        );
      });
    }

    const [view, setView] = useState(getView(formattedValue));
    const [openDialog, setOpenDialog] = useState(false);
    const displayLegends =
      (displayVerticalMargin || displayHorizontalMargin) && (displayVerticalPadding || displayHorizontalPadding);

    const { itemMap } = Uu5Forms.useFormApi();
    const origErrorListRef = useRef();
    const errorList = origErrorListRef.current || itemMap[name]?.errorList || [];

    function handleChange(e) {
      if (typeof onChange === "function") {
        let newMargin;
        if (displayVerticalMargin || displayHorizontalMargin) {
          newMargin = getValueForOnChange(e.data.value.margin, displayVerticalMargin, displayHorizontalMargin);
        }

        let newPadding;
        if (displayVerticalPadding || displayHorizontalPadding) {
          newPadding = getValueForOnChange(e.data.value.padding, displayVerticalPadding, displayHorizontalPadding);
        }

        // origErrorListRef is used for displaying error state in inputs/sliders during onChange
        // during onChange the form does not provide any errorList, so it is necessary to keep its reference
        let marginErrors = checkErrorList(e.data.value.margin, "margin", view, errorList);
        let paddingErrors = checkErrorList(e.data.value.padding, "padding", view, errorList);
        origErrorListRef.current = [...marginErrors, ...paddingErrors];

        // units are added in the Unit input (onBlur function)
        // it is not necessary to add units during formatting
        if (isNecessaryAddUnitRef.current) isNecessaryAddUnitRef.current = false;
        onChange(new Utils.Event({ value: { margin: newMargin, padding: newPadding } }, e));
      }
    }

    function handleViewChange(e) {
      const newView = e.data.value;
      if (newView === SIMPLE_VIEW && view === ADVANCED_VIEW) {
        // getView function returns the view based on the values in prop.value
        // if all values are only adaptive values, the user didn't update value in advanced view
        // in this case it is not necessary to remove value
        let isChangedValue = getView(formattedValue) === ADVANCED_VIEW;
        if (isChangedValue) {
          setOpenDialog(true);
        } else {
          setView(newView);
        }
      } else if (newView === ADVANCED_VIEW && view === SIMPLE_VIEW) {
        setView(newView);
      }
    }

    function handleValidate(value) {
      let marginErrorList = getErrorList(value.margin, "margin");
      let paddingErrorList = getErrorList(value.padding, "padding");

      let result = [...marginErrorList, ...paddingErrorList];
      return result.length > 0 ? result : undefined;
    }

    function handleBlur(e) {
      if (typeof onBlur === "function") {
        // this function triggers validations on sliders/inputs
        // function does not affect the change of value
        onBlur(new Utils.Event({ ...e.data, value: propsValue }), e);
      }
    }
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const [elementAttrs, componentProps] = Utils.VisualComponent.splitProps(otherProps, Css.main());
    const ComponentView = view === SIMPLE_VIEW ? SimpleView : AdvancedView;

    return (
      <div {...elementAttrs}>
        <Uu5Forms.SwitchSelect
          value={view}
          onChange={handleViewChange}
          itemList={[
            { value: SIMPLE_VIEW, children: <Lsi import={importLsi} path={["FormSpaces", SIMPLE_VIEW]} /> },
            { value: ADVANCED_VIEW, children: <Lsi import={importLsi} path={["FormSpaces", ADVANCED_VIEW]} /> },
          ]}
        />
        <ComponentView
          {...componentProps}
          value={formattedValue || {}}
          onChange={handleChange}
          displayVerticalMargin={displayVerticalMargin}
          displayHorizontalMargin={displayHorizontalMargin}
          displayVerticalPadding={displayVerticalPadding}
          displayHorizontalPadding={displayHorizontalPadding}
          displayLegends={displayLegends}
          onValidate={(e) => {
            let result = e.data.type === "mount" ? true : handleValidate(e.data.value);
            if ((result === undefined || result === true) && typeof onValidate === "function") {
              result = onValidate(e);
            }
            origErrorListRef.current = undefined;
            return result;
          }}
          errorList={errorList}
          onBlur={handleBlur}
        />
        <Uu5Elements.Dialog
          open={openDialog}
          onClose={() => setOpenDialog(false)}
          header={<Lsi import={importLsi} path={["FormSpaces", "dialogHeader"]} />}
          icon="uugds-right-left"
          info={<Lsi import={importLsi} path={["FormSpaces", "dialogInfo"]} />}
          actionDirection="horizontal"
          actionList={[
            {
              children: <Lsi import={importLsi} path={["FormSpaces", "dialogCancel"]} />,
              onClick: () => setOpenDialog(false),
              significance: "distinct",
            },
            {
              children: <Lsi import={importLsi} path={["FormSpaces", "dialogConfirm"]} />,
              onClick: () => {
                if (typeof onChange === "function") {
                  onChange(new Utils.Event({ value: { margin: undefined, padding: undefined } }));
                }
                setView(SIMPLE_VIEW);
              },
              colorScheme: "primary",
              significance: "highlighted",
            },
          ]}
        />
      </div>
    );
    //@@viewOff:render
  },
});

const SpacesInput = Uu5Forms.withFormInput(_SpacesInput);

//@@viewOn:exports
export { SpacesInput };
export default SpacesInput;
//@@viewOff:exports
