//@@viewOn:imports
import { Utils, createComponent, useState } from "uu5g05";
//@@viewOff:imports

//@@viewOn:constants
//@@viewOff:constants

//@@viewOn:css
//@@viewOff:css

//@@viewOn:helpers
function preferContentProp(content, children) {
  return (
    content !== undefined &&
    (children == null || Utils.Content.toArray(children).every((it) => typeof it === "string" && /^\s*$/.test(it)))
  );
}
//@@viewOff:helpers

function withDcc(Component) {
  let ResultComponent = createComponent({
    //@@viewOn:statics
    uu5Tag: `withDcc(${Component.uu5Tag})`,
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
      const { content, children, ...otherProps } = props;
      const { editMode, generatedId, ref_ } = otherProps;
      const [changedProps, setChangedProps] = useState();
      const isDcc = generatedId !== undefined || ref_ !== undefined;

      function onChange({ props }) {
        let newProps = { ...changedProps, ...props };
        setChangedProps(newProps);
        editMode.onChange({ props: newProps });
      }
      function onEditEnd(...args) {
        setChangedProps(undefined);
        editMode.onEditEnd(...args);
      }
      //@@viewOff:private

      //@@viewOn:interface
      //@@viewOff:interface

      //@@viewOn:render
      return (
        <Component {...otherProps} editMode={isDcc && editMode?.edit ? { ...editMode, onChange, onEditEnd } : editMode}>
          {/* uuDcc passes props.content if it inserted uuDcc Placeholder into an empty item */}
          {Component.editMode?.enablePlaceholder && preferContentProp(content, children) ? content : children}
        </Component>
      );
      //@@viewOff:render
    },
  });
  Utils.Component.mergeStatics(ResultComponent, Component);

  return ResultComponent;
}

//@@viewOn:exports
export { withDcc, preferContentProp };
export default withDcc;
//@@viewOff:exports
