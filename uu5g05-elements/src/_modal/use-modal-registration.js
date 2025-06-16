//@@viewOn:imports
import { Utils, createComponent, useCallback, useEffect, useMemo, useState } from "uu5g05";
import Config from "../config/config.js";
//@@viewOff:imports

//@@viewOn:constants
const [ModalRegistrationContext, useModalRegistrationContext] = Utils.Context.create({});
//@@viewOff:constants

//@@viewOn:helpers
let idCounter = 0;
const useModalRegistration = (openOrVisible) => {
  const { addItem, removeItem } = useModalRegistrationContext();
  const [id] = useState(() => idCounter++);

  useEffect(() => {
    if (openOrVisible) {
      addItem?.(id);
      return () => removeItem?.(id);
    }
    // eslint-disable-next-line uu5/hooks-exhaustive-deps
  }, [openOrVisible]);
};
//@@viewOff:helpers

const ModalRegistrationProvider = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "ModalRegistrationProvider",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { children } = props;

    const [itemList, setItemList] = useState([]);
    // chain item operations upwards, e.g. when having Popover with nested Popover with nested Modal (where Popover
    // contains the provider) - the outer Popover must know that there is inner Modal so that it doesn't close itself
    // when user clicks on overlay)
    const parentModalRegistrationContext = useModalRegistrationContext();
    const { addItem: parentAddItem, removeItem: parentRemoveItem } = parentModalRegistrationContext;

    const addItem = useCallback(
      (id) => {
        setItemList((v) => (v.some((it) => it.id === id) ? v : [...v, { id }]));
        return parentAddItem?.(id);
      },
      [parentAddItem],
    );
    const removeItem = useCallback(
      (id) => {
        setItemList((v) => v.filter((it) => it.id !== id));
        return parentRemoveItem?.(id);
      },
      [parentRemoveItem],
    );
    const contextValue = useMemo(() => ({ itemList, addItem, removeItem }), [addItem, itemList, removeItem]);
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      <ModalRegistrationContext.Provider value={contextValue}>
        {typeof children === "function" ? children(contextValue) : children}
      </ModalRegistrationContext.Provider>
    );
    //@@viewOff:render
  },
});

export { useModalRegistration, ModalRegistrationProvider };
export default useModalRegistration;
