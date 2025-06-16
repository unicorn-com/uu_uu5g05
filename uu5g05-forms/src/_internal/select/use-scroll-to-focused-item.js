//@@viewOn:imports
import { useEffect, useRef } from "uu5g05";
//@@viewOff:imports

function useScrollToFocusedItem(itemList, visible) {
  const refs = useRef([]);

  const prevItemIndex = useRef();

  useEffect(() => {
    refs.current = refs.current.slice(0, itemList.length);

    const itemIndex = itemList.findIndex((item) => item.focused);
    const element = refs.current[itemIndex];

    if (element && visible && prevItemIndex.current !== itemIndex) {
      element.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    prevItemIndex.current = itemIndex;
  }, [itemList, visible]);

  return { refs };
}

export { useScrollToFocusedItem };
export default useScrollToFocusedItem;
