import { useContentSize } from "uu5g05";
import { GridUtils } from "./grid-utils.js";
import useSpacing from "../use-spacing.js";

function useGridStyle(gridSettings) {
  const contentSize = useContentSize();
  const spacing = useSpacing();
  return GridUtils.getGridStyle(gridSettings, contentSize, spacing);
}

export { useGridStyle };
export default useGridStyle;
