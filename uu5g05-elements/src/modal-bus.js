//@@viewOn:imports
import {
  createComponent,
  useDevice,
  useMemo,
  usePreviousValue,
  useState,
  Utils,
  PropTypes,
  _ModalBusContext,
  _useActivePublisher,
} from "uu5g05";
import Config from "./config/config.js";
import useModalPortalElement from "./_modal/use-modal-portal-element.js";
import useModalTransition from "./_modal/use-modal-transition.js";
import Overlay from "./_modal/overlay.js";
import ModalView from "./_modal/modal-view.js";
import useModalPosition from "./_modal/use-modal-position.js";
import { getMetrics } from "./_modal/modal-metrics.js";
import importLsi from "./lsi/import-lsi";
//@@viewOff:imports

const DEFAULT_LSI = {
  modalList: { import: importLsi, path: ["ModalBus", "modalList"] },
};

const ModalBus = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "ModalBus",
  //@@viewOff:statics

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
    const { children, lsi } = props;
    const { isMobileOrTablet } = useDevice();

    // Note: Preserve active state of the component.
    // Main usage is for Ecc where click on Overlay (outside of Modal) deactivate active state of the component.
    const overlayElementAttrs = _useActivePublisher();

    const [itemStackValue, setItemStackValue] = useState(() => {
      function addItem(id, props, dialogRef) {
        setItemStackValue((state) =>
          updateItemListMetricsOnActiveIdChange(state, {
            ...state,
            itemList: [...state.itemList, { props, id, dialogRef, metrics: null }],
            activeId: id,
          }),
        );
      }

      function updateItemProps(id, props) {
        setItemStackValue((state) => updateItemListProps(state, id, props));
      }

      function removeItem(id) {
        setItemStackValue((state) => {
          let newState = { ...state, itemList: state.itemList.filter((it) => it.id !== id) };
          if (newState.itemList.length === state.itemList.length) return state; // non-existing id
          if (newState.activeId === id) {
            let newActiveId = newState.itemList[newState.itemList.length - 1]?.id;
            newState.activeId = newActiveId;
          }
          newState = updateItemListMetricsOnActiveIdChange(state, newState);
          return newState;
        });
      }

      function setActiveItem(id) {
        setItemStackValue((state) =>
          state.activeId === id
            ? state
            : state.itemList.some((it) => it.id === id)
              ? updateItemListMetricsOnActiveIdChange(state, { ...state, activeId: id })
              : state,
        );
      }

      return {
        itemList: [],
        activeId: null,
        setActiveItem,
        addItem,
        removeItem,
        updateItemProps,
      };
    });

    const { itemList, activeId } = itemStackValue;
    const lastModal = itemList[itemList.length - 1];
    const activeModal = itemList.find((item) => item.id === activeId);
    const prevItemList = usePreviousValue(itemList, itemList);

    const [containerNeededMap, setContainerNeededMap] = useState({});
    const [containerElement, setContainerElement] = useState(null);
    let [collapsed, setCollapsed] = useState(false);
    if (itemList.length === 0) {
      if (collapsed) setCollapsed((collapsed = false));
    }

    let [position, setPosition] = useState();
    if (itemList.length !== prevItemList.length && position) setPosition((position = undefined));
    const { onMoveStart, style: viewStyle } = useModalPosition(collapsed, activeModal?.metrics, position, setPosition);

    const ctxValue = useMemo(
      () => ({
        ...itemStackValue,
        containerElement,
        onMoveStart: (...args) => {
          if (!collapsed) setItemStackValue((state) => updateItemListMetrics(state.activeId, state));
          onMoveStart(...args);
        },
        collapsed,
        setCollapsed: (newCollapsed) => {
          setCollapsed(newCollapsed);
          if (newCollapsed) {
            setItemStackValue((state) => updateItemListMetrics(state.activeId, state));
          }
        },
        onContainerNeeded: (id, needed) =>
          setContainerNeededMap((map) => {
            if (map[id] === (needed || undefined)) return map;
            let newMap = { ...map };
            if (needed) newMap[id] = needed;
            else delete newMap[id];
            return newMap;
          }),
        lsi: { ...DEFAULT_LSI, ...lsi },
      }),
      [collapsed, containerElement, itemStackValue, lsi, onMoveStart],
    );

    const element = useModalPortalElement();

    const { ref: overlayRef, displayed, overlayClassName, dialogClassName } = useModalTransition(!!lastModal, false);
    const viewClassName = Utils.Css.joinClassName(
      dialogClassName,
      Config.Css.css({
        pointerEvents: "none", // so that view-area clicks fall through to the Overlay, possibly closing the dialog
        "&>*": { pointerEvents: "all" },
        bottom: lastModal && activeModal && lastModal.id !== activeModal.id ? BOTTOM_GAP : undefined,
      }),
    );
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const overlayProps =
      lastModal?.id && lastModal.id === activeModal.id
        ? {
            onClose: lastModal.props.onClose,
            closeOnEsc: lastModal.props.disabled ? false : lastModal.props.closeOnEsc,
            closeOnOverlayClick: lastModal.props.disabled ? false : lastModal.props.closeOnOverlayClick,
          }
        : null;

    return (
      <>
        <_ModalBusContext.Provider value={ctxValue}>{children}</_ModalBusContext.Provider>
        {
          // rendered only when needed, i.e. when a modal is opened (just like in non-modalbus modals) or
          // there is closing animation
          Object.keys(containerNeededMap).length > 0 || displayed
            ? Utils.Dom.createPortal(
                <>
                  {displayed && (
                    <Overlay
                      className={overlayClassName}
                      elementRef={overlayRef}
                      {...overlayProps}
                      elementAttrs={overlayElementAttrs}
                    />
                  )}
                  <ModalView
                    style={viewStyle}
                    className={viewClassName}
                    elementRef={setContainerElement}
                    _bottomSheetDisabled={!isMobileOrTablet}
                  />
                </>,
                element,
              )
            : null
        }
      </>
    );
    //@@viewOff:render
  },
});

//@@viewOn:helpers
const BOTTOM_GAP = 8;

function updateItemListMetricsOnActiveIdChange(oldState, newState) {
  if (oldState.activeId === newState.activeId) return newState;

  // re-measure previous active dialog (just before deactivation animation)
  let prevActiveItemIndex = newState.itemList.findIndex((item) => item.id === oldState.activeId);
  if (prevActiveItemIndex !== -1) {
    let item = newState.itemList[prevActiveItemIndex];
    if (item.dialogRef.current) {
      // in some cases, there is no dialogRef.current, because the dialog was unmounted see https://uuapp.plus4u.net/uu-sls-maing01/e80acdfaeb5d46748a04cfc7c10fdf4e/issueDetail?id=66053fa30730c500355f2295
      if (newState === oldState) newState = { ...oldState };
      newState.itemList = [...newState.itemList];
      newState.itemList[prevActiveItemIndex] = { ...item, metrics: getMetrics(item.dialogRef.current) };
    }
  }

  // re-measure new active dialog if it just got opened (just before activation animation)
  let newActiveItemIndex = newState.itemList.findIndex((item) => item.id === newState.activeId);
  let newActiveItemIsNewlyAdded = !oldState.itemList.some((item) => item.id === newState.activeId);
  if (newActiveItemIndex !== -1 && newActiveItemIsNewlyAdded) {
    let item = newState.itemList[newActiveItemIndex];
    if (item.dialogRef.current) {
      // in some cases, there is no dialogRef.current, because the dialog was unmounted see https://uuapp.plus4u.net/uu-sls-maing01/e80acdfaeb5d46748a04cfc7c10fdf4e/issueDetail?id=66053fa30730c500355f2295
      if (newState === oldState) newState = { ...oldState };
      newState.itemList = [...newState.itemList];
      newState.itemList[newActiveItemIndex] = { ...item, metrics: getMetrics(item.dialogRef.current) };
    }
  }
  return newState;
}

function updateItemListMetrics(activeId, oldState) {
  let newState;
  let activeItemIndex = oldState.itemList.findIndex((item) => item.id === activeId);
  if (activeItemIndex !== -1) {
    let item = oldState.itemList[activeItemIndex];
    if (item.dialogRef.current) {
      // in some cases, there is no dialogRef.current, because the dialog was unmounted see https://uuapp.plus4u.net/uu-sls-maing01/558dcc308da34b82bbe044d94074802f/issueDetail?id=672e9aaaaac55d0034940f72
      newState = { ...oldState };
      newState.itemList = [...newState.itemList];
      newState.itemList[activeItemIndex] = { ...item, metrics: getMetrics(item.dialogRef.current) };
    }
  }
  return newState || oldState;
}

function updateItemListProps(state, id, newProps) {
  const itemIndex = state.itemList.findIndex((item) => item.id === id);
  if (itemIndex === -1) return state;

  const item = state.itemList[itemIndex];
  if (Utils.Object.deepEqual(item.props, newProps)) return state; // no change in props => return prevState

  const newState = { ...state };
  newState.itemList = [...newState.itemList];
  newState.itemList[itemIndex] = { ...item, props: newProps };

  return newState;
}
//@@viewOff:helpers

export { ModalBus };
export default ModalBus;
