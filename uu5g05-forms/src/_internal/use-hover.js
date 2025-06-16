import { useEvent, useRef, useState } from "uu5g05";

function useHover(disabled) {
  const elementRef = useRef();
  const [isHovered, setIsHovered] = useState(false);

  useEvent(
    "mouseenter",
    (e) => {
      if (!disabled) {
        setIsHovered(true);
      }
    },
    elementRef,
  );

  useEvent(
    "mouseleave",
    (e) => {
      if (!disabled) {
        setIsHovered(false);
      }
    },
    elementRef,
  );
  return [isHovered, elementRef];
}

export default useHover;
