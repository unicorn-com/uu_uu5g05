import { useContentSize } from "uu5g05";
import { GridUtils } from "./grid-utils.js";

function useGridItemStyle(gridItemSettings) {
  const contentSize = useContentSize();
  return GridUtils.getGridItemStyle(gridItemSettings, contentSize);
}

export { useGridItemStyle };
export default useGridItemStyle;
