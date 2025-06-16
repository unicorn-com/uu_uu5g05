//@@viewOn:imports
import { createVisualComponent, Utils, Lsi, PropTypes, useEffect } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "./config/config.js";
import useForm from "./use-form.js";
import { useFormFormContext } from "./_internal/form-form-context.js";
import FormUnhandledError from "./form-unhandled-error.js";
import FormTextArea from "./form-text-area";
import { getHeight } from "./text-area";
import importLsi from "./lsi/import-lsi.js";
//@@viewOff:imports

//@@viewOn:constants
const COLUMN_GAP_SPACING = "d";
const ROW_GAP_SPACING = "d";
const COLOR_SCHEME_BY_FEEDBACK = {
  error: "negative",
  warning: "warning",
  success: "positive",
};
const ERROR_ROW_GRID_AREA = "uu5-fer";
//@@viewOff:constants

//@@viewOn:helpers
function ErrorMessage({ error, fallback }) {
  let result;
  if (error instanceof Utils.Error.Message) {
    if (error.lsi) {
      result = <Lsi lsi={error.lsi} params={error.messageParams} />;
    } else {
      result =
        error.messageParams !== undefined
          ? Utils.String.format(
              error.message,
              ...(Array.isArray(error.messageParams) ? error.messageParams : [error.messageParams]),
            )
          : error.message;
    }
  }
  if (result === undefined) result = fallback ?? null;
  return result;
}

function getFormGridChildren(children, size = "m") {
  children = Utils.Content.toArray(children);

  return children.map((child) => {
    if (child?.props?.name) {
      return Utils.Element.clone(child, {
        className: Utils.Css.joinClassName(
          child.props.className,
          Config.Css.css({
            gridArea: child.props.name,
            ...(child.type.uu5Tag === FormTextArea.uu5Tag
              ? {
                  alignSelf: "stretch",
                  alignItems: "start",
                  gridAutoRows: "auto 1fr",
                  "& textarea": { height: "100%", minHeight: getHeight(size) },
                }
              : null),
          }),
        ),
      });
    } else {
      return child;
    }
  });
}

function getChildrenFromInputMap(inputMap) {
  return Object.keys(inputMap).map((name) => {
    const { component: Component, props, formValue } = inputMap[name];
    return <Component key={name} name={name} {...(typeof props === "function" ? props(formValue) : props)} />;
  });
}

function getGridStyleWithErrorRow(style) {
  let { gridTemplateAreas } = style;
  let row = gridTemplateAreas.split(/['"]/)[1]?.trim();
  let columnCount = row?.split(/\s+/).length;
  if (columnCount) {
    let errorRow = new Array(columnCount).fill(ERROR_ROW_GRID_AREA).join(" ");
    gridTemplateAreas = `'${errorRow}' ${gridTemplateAreas}`;
    style = { ...style, gridTemplateAreas };
  }
  return style;
}

//@@viewOff:helpers

const DEFAULT_LSI = {
  formLeaveHeader: { import: importLsi, path: ["Form", "formLeaveHeader"] },
  formLeaveInfo: { import: importLsi, path: ["Form", "formLeaveInfo"] },
  formLeaveConfirm: { import: importLsi, path: ["Form", "formLeaveConfirm"] },
  formLeaveCancel: { import: importLsi, path: ["Form", "formLeaveCancel"] },
};

const _FormView = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Form.View",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    lsi: PropTypes.object,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    lsi: DEFAULT_LSI,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { children, lsi, _gridStyle, _spacing } = props;
    const {
      submit,
      reset,
      allowLeave,
      refuseLeave,
      errorList,
      setErrorList,
      submitError,
      setSubmitError,
      nativeSubmitButtonElementRef,
    } = useFormFormContext();
    let { autoComplete } = useForm();

    switch (autoComplete) {
      case true:
        autoComplete = "on";
        break;
      case false:
        autoComplete = "off";
        break;
    }
    const fullLsi = { ...DEFAULT_LSI, ...lsi };
    const hasValidationErrors = errorList.length > 0;
    const hasDisplayableSubmitError = submitError && !(submitError instanceof FormUnhandledError);
    const needsErrorRow = hasValidationErrors || hasDisplayableSubmitError;
    const rowGap = _spacing[ROW_GAP_SPACING];
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const { disabled: _, ...attrs } = Utils.VisualComponent.getAttrs(
      props,
      _gridStyle ? Config.Css.css(needsErrorRow ? getGridStyleWithErrorRow(_gridStyle) : _gridStyle) : undefined,
    );

    return (
      <form
        {...attrs}
        autoComplete={autoComplete}
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation(); // stop propagation to not submit parent form (if this form is nested in another form)

          // any <button> without "type" attribute is by default a "submit button" according to the HTML spec :-/
          // "The missing value default is the Submit Button state."
          // https://www.w3.org/TR/2011/WD-html5-20110525/the-button-element.html#the-button-element
          //   => we don't want that so we'll allow submit only if the button does have explicitly set type="submit"
          //      (note that this doesn't affect us much because we use <input type="submit"> for Enter, and <button type="button">
          //      in our SubmitButton; so this is for cases when developers create their own e.g. ToggleButton and forget
          //      to explicitly pass type="button" to their <button>)
          let nativeEvent = e.nativeEvent || e;
          if (nativeEvent.submitter?.tagName === "BUTTON" && nativeEvent.submitter.getAttribute("type") !== "submit") {
            nativeEvent.stopImmediatePropagation();
          } else {
            // sending event as we need to distinguish between DOM submit and standalone submit() call
            submit?.(e)?.catch?.((error) => {
              if (error?.code === "abortSubmitButtonDisabled") {
                if (process.env.NODE_ENV !== "production") {
                  _FormView.logger.warn("Form submit was ignored because SubmitButton is disabled.");
                }
                return;
              }
              return Promise.reject(error);
            });
          }
        }}
        onReset={(e) => {
          e.preventDefault();
          e.stopPropagation(); // stop propagination because of form could be nested in another forms
          reset?.();
        }}
        noValidate
      >
        {needsErrorRow ? (
          <Uu5Elements.Grid
            rowGap={_gridStyle ? "inherit" : rowGap}
            className={Config.Css.css({ gridArea: ERROR_ROW_GRID_AREA, marginBottom: _gridStyle ? undefined : rowGap })}
          >
            {hasValidationErrors
              ? // Form onValidate errors
                errorList.map((errorItem, i) => (
                  <Uu5Elements.HighlightedBox
                    key={"ve-" + (errorItem?.code ?? i)}
                    colorScheme={COLOR_SCHEME_BY_FEEDBACK[errorItem?.feedback ?? "error"] ?? "negative"}
                    onClose={() => setErrorList((v) => v.filter((it) => it !== errorItem))}
                    durationMs={errorItem?.durationMs}
                  >
                    <Lsi lsi={errorItem.message} params={errorItem.messageParams} />
                  </Uu5Elements.HighlightedBox>
                ))
              : null}
            {hasDisplayableSubmitError ? (
              // Form onSubmit error
              <Uu5Elements.HighlightedBox key="se" colorScheme="negative" onClose={() => setSubmitError(undefined)}>
                <ErrorMessage error={submitError} />
              </Uu5Elements.HighlightedBox>
            ) : null}
          </Uu5Elements.Grid>
        ) : null}

        {children}

        <Uu5Elements.Dialog
          open={!!allowLeave}
          onClose={() => refuseLeave()}
          icon="uugdsstencil-home-exit"
          header={<Lsi lsi={fullLsi.formLeaveHeader} />}
          info={<Lsi lsi={fullLsi.formLeaveInfo} />}
          actionList={[
            {
              children: <Lsi lsi={fullLsi.formLeaveConfirm} />,
              onClick: () => allowLeave(),
              colorScheme: "negative",
              significance: "highlighted",
            },
            {
              children: <Lsi lsi={fullLsi.formLeaveCancel} />,
              onClick: () => refuseLeave(),
              significance: "distinct",
            },
          ]}
        />

        <input type="submit" hidden ref={nativeSubmitButtonElementRef} />
      </form>
    );
    //@@viewOff:render
  },
});

const FormView = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Form.View",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    gridLayout: Uu5Elements.Grid.propTypes.templateAreas,
    inputMap: PropTypes.object, // name: { component, props }
    lsi: PropTypes.object,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    gridLayout: undefined,
    inputMap: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    let { gridLayout, layout, inputMap, children, ...propsToPass } = props;
    let { size } = propsToPass;
    const spacing = Uu5Elements.useSpacing();

    gridLayout ||= layout;
    children ||= inputMap && getChildrenFromInputMap(inputMap);

    if (process.env.NODE_ENV !== "production") {
      useEffect(() => {
        if (layout) FormView.logger.warn(`Property "layout" is deprecated, use "gridLayout" instead.`);
      }, [layout]);
    }
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    if (gridLayout) {
      return (
        <Uu5Elements.Grid
          columnGap={spacing[COLUMN_GAP_SPACING]}
          rowGap={spacing[ROW_GAP_SPACING]}
          alignItems="start"
          templateAreas={gridLayout}
        >
          {({ style }) => (
            <_FormView {...propsToPass} _gridStyle={style} _spacing={spacing}>
              {getFormGridChildren(children, size)}
            </_FormView>
          )}
        </Uu5Elements.Grid>
      );
    } else {
      return (
        <_FormView {...propsToPass} _spacing={spacing}>
          {children}
        </_FormView>
      );
    }
    //@@viewOff:render
  },
});

FormView.COLUMN_GAP_SPACING = COLUMN_GAP_SPACING;
FormView.ROW_GAP_SPACING = ROW_GAP_SPACING;

export { FormView };
export default FormView;
