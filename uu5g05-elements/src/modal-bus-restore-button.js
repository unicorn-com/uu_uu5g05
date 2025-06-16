//@@viewOn:imports
import { PropTypes, createVisualComponent, useState, _ModalBusContext } from "uu5g05";
import Config from "./config/config.js";
import Button from "./button.js";
import RestoreButtonConfirmDialog from "./_internal/restore-button-confirm-dialog.js";
//@@viewOff:imports

const STATICS = {
  //@@viewOn:statics
  uu5Tag: Config.TAG + "ModalBus.RestoreButton",
  //@@viewOff:statics
};

let buttonPropTypes = { ...Button.propTypes };
delete buttonPropTypes.onClick;

const RestoreButton = createVisualComponent({
  ...STATICS,

  //@@viewOn:propTypes
  propTypes: {
    ...buttonPropTypes,
    modalId: PropTypes.string.isRequired,
    lsi: PropTypes.object,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    modalId: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    let { modalId } = props;
    let { lsi, ...restProps } = props;
    let { itemList } = _ModalBusContext.useModalBusContext() || {};

    let [confirmOpen, setConfirmOpen] = useState(false);
    let modalIndex = itemList?.findIndex((it) => it.props.id === modalId);

    function onConfirm() {
      for (let i = itemList.length - 1; i > modalIndex; i--) {
        let { onClose } = itemList[i].props;
        if (typeof onClose === "function") onClose();
      }
    }
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return modalIndex >= 0 && modalIndex < itemList.length - 1 ? (
      <>
        <Button {...restProps} onClick={() => setConfirmOpen(true)} />
        <RestoreButtonConfirmDialog
          lsi={lsi}
          open={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={onConfirm}
        />
      </>
    ) : null;
    //@@viewOff:render
  },
});

//@@viewOn:helpers
//@@viewOff:helpers

export { RestoreButton };
export default RestoreButton;
