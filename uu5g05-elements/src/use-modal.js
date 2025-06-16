//@@viewOn:imports
import { useState, useCallback } from "uu5g05";
//@@viewOff:imports

function useModal() {
  const [modalProps, setModal] = useState({ open: false });

  const close = useCallback(() => setModal({ open: false }), [setModal]);
  const open = useCallback((props) => setModal({ ...props, open: true, onClose: close }), [setModal, close]);

  return [modalProps, open, close];
}

//@@viewOn:exports
export { useModal };
export default useModal;
//@@viewOff:exports
