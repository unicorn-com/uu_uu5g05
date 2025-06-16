//@@viewOn:imports
import { createComponent, Lsi, PropTypes } from "uu5g05";
import { Modal } from "uu5g05-elements";
import Uu5Forms from "uu5g05-forms";
import ModalFooter from "./modal-footer.js";
import { FormPositionNumber } from "./position-number-input.js";
import Config from "../../config/config.js";
import importLsi from "../../lsi/import-lsi.js";
//@@viewOff:imports

//@@viewOn:helpers
//@@viewOff:helpers

const ItemPositionModal = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "ItemPositionModal",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...Modal.propTypes,
    itemPosition: PropTypes.number,
    itemCount: PropTypes.number.isRequired,
    onSave: PropTypes.func.isRequired,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    itemPosition: 1,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { children, onClose, onSave, itemPosition, itemCount, ...propsToPass } = props;

    const _onSave = (e) => {
      let { position } = e.data.value;
      if (position === itemPosition + 1) onClose();
      else onSave(position - 1);
    };
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      <Uu5Forms.Form.Provider onSubmit={_onSave}>
        <Modal
          {...propsToPass}
          onClose={onClose}
          header={<Lsi import={importLsi} path={["ItemPositionModal", "header"]} />}
          width="24em"
          footer={<ModalFooter onCancel={onClose} lsiRoot="ItemPositionModal" />}
        >
          <Uu5Forms.Form.View>
            <FormPositionNumber name="position" initialValue={itemPosition + 1} max={itemCount} />
          </Uu5Forms.Form.View>
        </Modal>
      </Uu5Forms.Form.Provider>
    );
    //@@viewOff:render
  },
});

export { ItemPositionModal };
export default ItemPositionModal;
