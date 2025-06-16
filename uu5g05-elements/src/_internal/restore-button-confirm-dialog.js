//@@viewOn:imports
import { createVisualComponent, Lsi, PropTypes } from "uu5g05";
import Config from "../config/config.js";
import Dialog from "../dialog.js";
import importLsi from "../lsi/import-lsi.js";
//@@viewOff:imports

const DEFAULT_LSI = {
  cancel: { import: importLsi, path: ["cancel"] },
  confirmMessage: { import: importLsi, path: ["RestoreButton", "confirmMessage"] },
  confirm: { import: importLsi, path: ["RestoreButton", "confirm"] },
};

const STATICS = {
  //@@viewOn:statics
  uu5Tag: Config.TAG + "RestoreButtonConfirmDialog",
  //@@viewOff:statics
};

const RestoreButtonConfirmDialog = createVisualComponent({
  ...STATICS,

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
    const { onConfirm, onCancel, lsi } = props;
    const fullLsi = { ...DEFAULT_LSI, ...lsi };
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      <Dialog
        header={<Lsi lsi={fullLsi.confirmMessage} />}
        actionList={[
          {
            children: <Lsi lsi={fullLsi.cancel} />,
            onClick: onCancel,
            significance: "distinct",
          },
          {
            children: <Lsi lsi={fullLsi.confirm} />,
            onClick: onConfirm,
            colorScheme: "negative",
            significance: "highlighted",
          },
        ]}
        actionDirection="horizontal"
        {...props}
      />
    );
    //@@viewOff:render
  },
});

//@@viewOn:helpers
//@@viewOff:helpers

export { RestoreButtonConfirmDialog };
export default RestoreButtonConfirmDialog;
