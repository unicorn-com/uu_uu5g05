import useContentSize from "./use-content-size";
import ScreenSize from "../utils/screen-size";

function useContentSizeValue(sizeOf) {
  const contentSize = useContentSize();
  return ScreenSize.getSizeValue(sizeOf, contentSize);
}

export { useContentSizeValue };
export default useContentSizeValue;
