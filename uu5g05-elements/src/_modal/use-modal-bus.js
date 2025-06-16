//@@viewOn:imports
import { useCallback, useEffect, useState, Utils, _ModalBusContext, useMemoObject } from "uu5g05";

//@@viewOff:imports

function useModalBus(open, modalProps, dialogRef) {
  const {
    itemList,
    activeId,
    addItem,
    removeItem,
    setActiveItem,
    updateItemProps,
    containerElement,
    onMoveStart,
    onContainerNeeded,
    lsi,
  } = _ModalBusContext.useModalBusContext();

  const [id] = useState(() => Utils.String.generateId());
  const setActive = useCallback((itemId = id) => setActiveItem(itemId), [id, setActiveItem]);

  const memoizedModalProps = useMemoObject(modalProps);

  let hasContainer = !!containerElement;
  useEffect(() => {
    if (open) {
      onContainerNeeded(id, true);
      return () => onContainerNeeded(id, false);
    }
    // eslint-disable-next-line uu5/hooks-exhaustive-deps
  }, [open]);

  useEffect(() => {
    // NOTE Must wait for container, otherwise there is JS error if Modal is opened from start (open=true in 1st render).
    if (open && hasContainer) {
      addItem(id, modalProps, dialogRef);
      return () => removeItem(id);
    }
    // eslint-disable-next-line uu5/hooks-exhaustive-deps
  }, [open, hasContainer]);

  useEffect(() => {
    if (open) {
      updateItemProps(id, memoizedModalProps);
    }
    // eslint-disable-next-line uu5/hooks-exhaustive-deps
  }, [open, memoizedModalProps]);

  const index = itemList.findIndex((item) => item.id === id);
  const isActive = activeId === id || (index === -1 && open);

  return {
    container: open ? (containerElement ?? null) : null,
    isActive,
    setActive,
    itemList,
    index,
    activeIndex: itemList.findIndex((item) => item.id === activeId),
    isLast: index === itemList.length - 1 || (index === -1 && open),
    isRegistered: index !== -1,
    onMoveStart: isActive ? onMoveStart : null,
    metrics: itemList[index]?.metrics,
    lsi,
  };
}

//@@viewOn:helpers
//@@viewOff:helpers

export default useModalBus;
