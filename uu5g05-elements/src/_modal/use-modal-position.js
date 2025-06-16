//@@viewOn:imports
import { useLayoutEffect, useState, useRef, Utils, usePreviousValue, useValueChange, useEvent } from "uu5g05";
//@@viewOff:imports

function useModalPosition(collapsed, uncollapsedMetrics, forcedPosition0, onForcedPositionChange = null) {
  // remember drag-start position; save drag-end position as forced
  let [forcedPosition, setForcedPosition] = useValueChange(forcedPosition0, onForcedPositionChange);
  let { dragging, dragX, dragY, onMoveStart } = useDraggable();
  let prevDragging = usePreviousValue(dragging, dragging);
  let dragStartPositionRef = useRef();
  if (dragging !== prevDragging) {
    if (dragging) dragStartPositionRef.current = forcedPosition || uncollapsedMetrics.dialogParentRect;
    else {
      let newForcedPosition = move(dragStartPositionRef.current, dragX, dragY);
      if (!Utils.Object.shallowEqual(forcedPosition, newForcedPosition)) setForcedPosition(newForcedPosition);
    }
  }

  // TODO This prevents issues with positioning due to modal `margin: 0 auto` styles. It's probably acceptable,
  // but maybe we should simply return dialogStyle with marginRight from here (and somehow propagate it in ModalBus).
  useEvent("resize", () => !collapsed && setForcedPosition(undefined), window);

  let usedPosition = forcedPosition;
  if (dragging) {
    usedPosition = move(dragStartPositionRef.current, dragX, dragY);
  }
  let style = undefined;
  if (usedPosition) {
    let { right, top } = usedPosition;
    let cssRight = `calc(100% - ${right}px)`;
    let dialogWidth = collapsed ? uncollapsedMetrics.headerCollapsedWidth : uncollapsedMetrics.dialogRect.width;
    let dialogMarginRight =
      uncollapsedMetrics.dialogParentRect.right -
      uncollapsedMetrics.dialogRect.right +
      (collapsed ? uncollapsedMetrics.collapseButtonOffsetRight : 0);
    let dialogTopOffset = uncollapsedMetrics.dialogRect.top - uncollapsedMetrics.dialogParentRect.top;
    let minVisibleWidth = collapsed ? dialogWidth : 100;
    let minVisibleHeight = 64;
    style = {
      right: `clamp(${-(dialogMarginRight + dialogWidth) + minVisibleWidth}px, ${cssRight}, 100% - ${
        minVisibleWidth + dialogMarginRight
      }px)`,
      top: `clamp(${-dialogTopOffset}px, ${top}px, 100% - ${minVisibleHeight + dialogTopOffset}px)`,
    };
  }

  return { style, onMoveStart };
}

function useDraggable() {
  let [state, setState] = useState(() => ({
    dragging: false,
    dragStartPointerPos: null,
    dragX: 0,
    dragY: 0,
  }));
  let { dragging, dragX, dragY } = state;

  const onMoveStart = useRef((e) => {
    let dragStartPointerPos = { left: e.clientX, top: e.clientY };
    setState({ dragStartPointerPos, dragging: true, dragX: 0, dragY: 0 });
  }).current;

  useLayoutEffect(() => {
    if (dragging) {
      let _onMouseMove = (e) => {
        e.preventDefault();
        let { clientX, clientY } = e;

        setState((state) => {
          let dragX = clientX - state.dragStartPointerPos.left;
          let dragY = clientY - state.dragStartPointerPos.top;
          return { ...state, dragX, dragY };
        });
      };
      let _onMouseUp = (e) => setState((state) => ({ ...state, dragging: false }));
      document.addEventListener("mousemove", _onMouseMove);
      document.addEventListener("mouseup", _onMouseUp);
      return () => {
        document.removeEventListener("mousemove", _onMouseMove);
        document.removeEventListener("mouseup", _onMouseUp);
      };
    }
  }, [dragging]);

  return { onMoveStart, dragging, dragX, dragY };
}

function move(position, dx, dy) {
  let right = position.right + dx;
  let top = position.top + dy;
  return { right, top };
}

export default useModalPosition;
