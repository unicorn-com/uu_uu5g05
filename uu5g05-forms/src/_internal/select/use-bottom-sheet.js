import { useDevice, useScreenSize } from "uu5g05";

function useBottomSheet() {
  const { isMobileOrTablet } = useDevice();
  const [screenSize] = useScreenSize();

  const isBottomSheet = isMobileOrTablet && screenSize === "xs";

  return { isBottomSheet };
}

export { useBottomSheet };
export default useBottomSheet;
