import { createComponent, PropTypes, Utils, withLazy } from "uu5g05";
import Config from "./config/config.js";

const Uu5EditingEditModal = withLazy(async () => {
  const Uu5Editing = await Utils.Uu5Loader.import("uu5g05-editing", import.meta.url);
  return { default: Uu5Editing.EditModal };
});

function withEditModal(Component, EditModal, opts = {}) {
  let isCustomEditModal = true;
  if (EditModal && typeof EditModal !== "function" && EditModal.tabList) {
    // EditModal is object with props (tabList, propInputMap etc.)
    opts = EditModal;
    EditModal = Uu5EditingEditModal;
    isCustomEditModal = false;
  }

  const { uu5Tag, editMode, tabList, propInputMap, editModalProps = {} } = opts;
  const ResultComponent = createComponent({
    //@@viewOn:statics
    uu5Tag: uu5Tag || `withEditModal(${Component.uu5Tag})`,
    editMode: {
      ...Component.editMode,
      displayType: "block",
      customEdit: !!EditModal,
      lazy: true,
      ...editMode,
    },
    //@@viewOff:statics

    //@@viewOn:propTypes
    propTypes: {
      ...Component.propTypes,
      editMode: PropTypes.object,
    },
    //@@viewOff:propTypes

    //@@viewOn:defaultProps
    defaultProps: {
      ...Component.defaultProps,
    },
    //@@viewOff:defaultProps

    //@@viewOn:render
    render(props) {
      let { editMode, ...componentProps } = props;
      const statics = { nestingLevel: Component.nestingLevel, uu5Tag: uu5Tag || Component.uu5Tag };
      const currentNestingLevel = Utils.NestingLevel.getNestingLevel(props, statics);
      const nestingLevel = currentNestingLevel ? currentNestingLevel : "inline";

      componentProps = { ...componentProps, nestingLevel };
      let propsToPass = {
        uu5Tag: Component.uu5Tag,
        defaultProps: Component.defaultProps,
        nestingLevelList: Component.nestingLevel,
      };

      if (!isCustomEditModal) {
        // props are passed to Uu5Editing.EditModal
        propsToPass = { ...propsToPass, open: true, props: componentProps };
      } else {
        // props are passed to custom edit modal
        propsToPass = { ...propsToPass, componentProps };
      }

      // add flag that onReady will be handled by EditModal
      if (typeof editMode?.onReady === "function") {
        editMode.onReady[Config.editModeOnReadyHandledFlag] = true;
      }

      return (
        <>
          <Component {...props} />
          {editMode?.edit && (
            <EditModal
              {...propsToPass}
              {...editModalProps}
              componentType={Component} // componentType is deprecated prop
              onSave={editMode.onEditEnd}
              onClose={editMode.onEditEnd}
              onReady={editMode.onReady}
              tabList={tabList}
              propInputMap={propInputMap}
            />
          )}
        </>
      );
    },
    //@@viewOff:render
  });
  Utils.Component.mergeStatics(ResultComponent, Component);
  return ResultComponent;
}

//@@viewOn:exports
export { withEditModal };
export default withEditModal;
//@@viewOff:exports
