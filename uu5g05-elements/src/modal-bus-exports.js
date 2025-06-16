import ModalBus from "./modal-bus.js";
import RestoreButton from "./modal-bus-restore-button.js";

// not directly in modal-bus.js due to cyclic dependencies
ModalBus.RestoreButton = RestoreButton;

export { ModalBus };
export default ModalBus;
