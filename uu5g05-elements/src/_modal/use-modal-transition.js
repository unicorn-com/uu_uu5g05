//@@viewOn:imports
import { useDevice, usePreviousValue, useRef, useState } from "uu5g05";
import Config from "../config/config.js";
import useTransition from "../_internal/use-transition.js";
//@@viewOff:imports

const TRANSITION_DURATION = Config.MODAL_TRANSITION_DURATION;

function useModalTransition(open, isDialogInsideOverlay) {
  const overlayRef = useRef();
  const { isMobileOrTablet } = useDevice();
  let [state, run] = useTransition(TRANSITION_DURATION, overlayRef);
  let [direction, setDirection] = useState("leave");
  let prevOpen = usePreviousValue(open, false);

  if (open !== prevOpen) {
    run();
    let newDirection = open ? "enter" : "leave";
    if (direction !== newDirection) setDirection((direction = newDirection));
  }

  let isTransiting = state !== "end";

  // if there's single standalone Modal, then opacity is animated on backdrop (and dialog itself
  // is inside of element with backdrop so dialog doesn't do opacity animation in such case), otherwise
  // it is animated on dialog only
  let isInOrGoingToLeaveState =
    (direction === "leave" && state !== "init") || (direction === "enter" && state === "init");
  let overlayClassName = Config.Css.css`
    opacity: ${isInOrGoingToLeaveState ? 0 : 1};
    transition: opacity ${TRANSITION_DURATION}ms ease-out;
  `;

  let transform = `translateY(${isInOrGoingToLeaveState ? "-25%" : "0"})`;
  if (isMobileOrTablet) {
    transform = `translateY(${isInOrGoingToLeaveState ? "100%" : "0"})`;
  }

  let dialogClassName = Config.Css.css`
    opacity: ${isDialogInsideOverlay ? 1 : isInOrGoingToLeaveState ? 0 : 1};
    transform: ${transform};
    transition: opacity ${TRANSITION_DURATION}ms ease-out, transform ${TRANSITION_DURATION}ms ease-out, bottom ${TRANSITION_DURATION}ms ease-out;
    ${isInOrGoingToLeaveState ? "pointer-events: none;" : ""}
  `;

  return { displayed: open || prevOpen || isTransiting, overlayClassName, dialogClassName, ref: overlayRef };
}

//@@viewOn:helpers
//@@viewOff:helpers

export default useModalTransition;
