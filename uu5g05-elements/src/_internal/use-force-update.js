import { useRef, useState } from "uu5g05";

function useForceUpdate() {
  let [, setValue] = useState(0);
  return useRef(() => setValue((c) => c + 1)).current;
}

export { useForceUpdate };
export default useForceUpdate;
