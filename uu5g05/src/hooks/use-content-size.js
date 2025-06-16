import { useContentSizeContext } from "../contexts/content-size-context.js";
import useScreenSize from "./use-screen-size";

function useContentSize() {
  let contentSizeContextValue = useContentSizeContext();
  let screenSize = useScreenSize();

  return contentSizeContextValue?.contentSize ?? screenSize[0];
}

export { useContentSize };
export default useContentSize;
