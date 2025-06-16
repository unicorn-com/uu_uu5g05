//@@viewOn:imports
import { Utils, createComponent, useEffect } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Tools from "./tools.js";
import InlineComponentLink from "./inline-component-link.js";
import Config from "./config/config.js";
//@@viewOff:imports

//@@viewOn:constants
//@@viewOff:constants

//@@viewOn:css
//@@viewOff:css

//@@viewOn:helpers
function removeUnnecessaryProps(props, defaultProps) {
  const newProps = {};

  for (let k in props) {
    const v = props[k];
    if (v !== undefined && v !== defaultProps?.[k] && k !== "nestingLevel") {
      newProps[k] = v;
    }
  }

  return newProps;
}
//@@viewOff:helpers

// TODO Next major - remove ComponentStatics from parameters (we should read those directly from Component).
function withNestingLevel(Component, ComponentStatics = Component, modalProps = {}) {
  const ResultComponent = createComponent({
    //@@viewOn:statics
    uu5Tag: `withNestingLevel(${Component.uu5Tag})`,
    //@@viewOff:statics

    //@@viewOn:propTypes
    propTypes: {
      ...Component.propTypes,
    },
    //@@viewOff:propTypes

    //@@viewOn:defaultProps
    defaultProps: {
      ...Component.defaultProps,
    },
    //@@viewOff:defaultProps

    render(props) {
      //@@viewOn:private
      const { editMode } = props;
      const spacing = Uu5Elements.useSpacing();
      //@@viewOff:private

      //@@viewOn:interface
      //@@viewOff:interface

      //@@viewOn:render
      const currentNestingLevel = Utils.NestingLevel.getNestingLevel(props, ComponentStatics);
      const showInline = currentNestingLevel === undefined || currentNestingLevel === "inline";

      useEffect(() => {
        if (showInline && editMode?.edit && ComponentStatics?.editMode?.lazy) {
          // if component uses both withEditModal+withNestingLevel, we'll let withEditModal handle the editMode.onReady()
          // (if we had not onReady handling here for "inline" nesting level, uuEcc would remain displaying "..." pending
          // indication because it would wait for the onReady call and we would be showing InlineComponentLink below, which
          // doesn't handle editMode at all)
          if (typeof editMode.onReady === "function" && !editMode.onReady[Config.editModeOnReadyHandledFlag]) {
            editMode.onReady();
          }
        }
        // eslint-disable-next-line uu5/hooks-exhaustive-deps
      }, [showInline, editMode?.edit, ComponentStatics?.editMode?.lazy]);

      let result;
      if (!showInline) {
        result = <Component {...props} nestingLevel={currentNestingLevel} />;
      } else {
        const { elementProps, componentProps } = Utils.VisualComponent.splitProps(props);
        delete componentProps.nestingLevel;

        let paddingStyle = { padding: spacing.d };
        if (modalProps.modalContentPadding) {
          let validPadding = Utils.Style.replaceAdaptiveSpacing(modalProps.modalContentPadding, spacing);
          let formattedPadding = Utils.ScreenSize.convertStringToObject(validPadding);
          paddingStyle = Utils.Style.parseSpace(formattedPadding, "padding");
        } else if (modalProps.modalContentPadding === null) {
          paddingStyle = undefined; // no padding
        }

        result = (
          <InlineComponentLink
            {...elementProps}
            editMode={componentProps.editMode}
            nestingLevel="inline"
            modalProps={{
              ...modalProps,
              header: Tools.getComponentNameFromUu5Tag(ComponentStatics.uu5Tag),
              children: ({ style }) =>
                paddingStyle ? (
                  <div className={Config.Css.css(paddingStyle)}>
                    <Component {...componentProps} />
                  </div>
                ) : (
                  <Component {...componentProps} />
                ),
            }}
            uveProps={{
              _uu5Tag: ComponentStatics.uu5Tag,
              _title: Tools.getComponentNameFromUu5Tag(ComponentStatics.uu5Tag),
              ...removeUnnecessaryProps(props, Component.defaultProps),
            }}
          >
            {Tools.getComponentNameFromUu5Tag(ComponentStatics.uu5Tag)}
          </InlineComponentLink>
        );
      }

      return result;
      //@@viewOff:render
    },
  });
  Utils.Component.mergeStatics(ResultComponent, Component);
  ResultComponent.nestingLevel = ComponentStatics.nestingLevel;
  return ResultComponent;
}

//@@viewOn:exports
export { withNestingLevel };
export default withNestingLevel;
//@@viewOff:exports
